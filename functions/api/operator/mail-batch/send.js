const MAX_RECIPIENTS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function safeText(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function getAccessIdentity(request, env) {
  const email = request.headers.get("cf-access-authenticated-user-email") || "";
  const jwt = request.headers.get("cf-access-jwt-assertion") || "";
  if (email || jwt) return { ok: true, method: "cloudflare_access", email };
  if (env.OPERATOR_ALLOW_NO_ACCESS === "true") return { ok: true, method: "env_override", email: "operator" };
  return { ok: false, method: "none", email: "" };
}

function validatePayload(payload) {
  const recipients = Array.isArray(payload.recipients)
    ? [...new Set(payload.recipients.map(x => String(x).trim().toLowerCase()).filter(Boolean))]
    : [];

  const invalid = recipients.filter(x => !EMAIL_RE.test(x));
  const subject = safeText(payload.subject, 240);
  const body = safeText(payload.body, 20000);
  const footer = safeText(payload.footer, 5000);
  const sender = safeText(payload.sender || "it@gnk-asg.hr", 240);
  const mode = safeText(payload.mode || "batch_send", 80);
  const campaign = safeText(payload.campaign || "", 240);
  const label = safeText(payload.label || "", 240);

  const problems = [];
  if (!sender || !EMAIL_RE.test(sender)) problems.push("Invalid sender.");
  if (!recipients.length) problems.push("No recipients.");
  if (recipients.length > MAX_RECIPIENTS) problems.push("Too many recipients. Maximum is 30.");
  if (invalid.length) problems.push("Invalid recipient address.");
  if (!subject) problems.push("Missing subject.");
  if (!body) problems.push("Missing body.");

  return {
    ok: problems.length === 0,
    problems,
    data: { recipients, sender, subject, body, footer, mode, campaign, label }
  };
}

async function sendViaResend(env, data) {
  const from = env.MAIL_FROM || data.sender;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: data.recipients,
      subject: data.subject,
      text: `${data.body}\n\n${data.footer || ""}`.trim()
    })
  });
  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}
  return { ok: response.ok, provider: "resend", status: response.status, response: parsed };
}

async function sendViaBrevo(env, data) {
  const senderEmail = env.MAIL_FROM || data.sender;
  const senderName = env.MAIL_FROM_NAME || "GNK ASG";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: data.recipients.map(email => ({ email })),
      subject: data.subject,
      textContent: `${data.body}\n\n${data.footer || ""}`.trim()
    })
  });
  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}
  return { ok: response.ok, provider: "brevo", status: response.status, response: parsed };
}

async function writeLog(env, entry) {
  if (!env.MAIL_LOG_KV || !env.MAIL_LOG_KV.put) return { ok: false, reason: "MAIL_LOG_KV not bound" };
  const key = `mail:${entry.created_at}:${entry.id}`;
  await env.MAIL_LOG_KV.put(key, JSON.stringify(entry, null, 2));
  return { ok: true, key };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);

  let payload;
  try { payload = await request.json(); }
  catch (_) { return json({ ok: false, error: "Invalid JSON payload." }, 400); }

  const validation = validatePayload(payload);
  if (!validation.ok) return json({ ok: false, error: "Validation failed.", problems: validation.problems }, 400);

  const data = validation.data;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  let sendResult;
  if (env.RESEND_API_KEY) sendResult = await sendViaResend(env, data);
  else if (env.BREVO_API_KEY) sendResult = await sendViaBrevo(env, data);
  else sendResult = { ok: false, provider: "none", status: 500, response: "No outbound mail provider configured." };

  const entry = {
    id,
    created_at: createdAt,
    sent_at: sendResult.ok ? new Date().toISOString() : null,
    sender: data.sender,
    recipient_count: data.recipients.length,
    subject: data.subject,
    campaign: data.campaign,
    label: data.label,
    mode: data.mode,
    status: sendResult.ok ? (data.mode === "test_send" ? "test_sent" : "sent") : "failed",
    provider: sendResult.provider,
    provider_status: sendResult.status,
    operator: access.email || access.method,
    error_message: sendResult.ok ? "" : String(sendResult.response || "send failed").slice(0, 500)
  };

  const log = await writeLog(env, entry).catch(error => ({ ok: false, reason: error.message }));

  return json({
    ok: sendResult.ok,
    id,
    provider: sendResult.provider,
    provider_status: sendResult.status,
    recipient_count: data.recipients.length,
    log,
    response: sendResult.response
  }, sendResult.ok ? 200 : 502);
}

export async function onRequestGet() {
  return json({ ok: true, endpoint: "mail-batch-send", methods: ["POST", "OPTIONS"], max_recipients: MAX_RECIPIENTS });
}
