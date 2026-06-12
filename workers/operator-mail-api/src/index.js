const MAX_RECIPIENTS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SENDERS = new Set(["it@gnk-asg.hr", "info@gnk-asg.hr"]);
const SENDER_NAMES = {
  "it@gnk-asg.hr": "IT – Osobni digitalni asistent",
  "info@gnk-asg.hr": "Nermin Sefić"
};

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

function cleanSender(value) {
  return safeText(value || envSafeDefaultSender(), 240).toLowerCase();
}

function senderName(sender) {
  return SENDER_NAMES[sender] || "GNK ASG";
}

function resendFrom(sender) {
  return `${senderName(sender)} <${sender}>`;
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
  const sender = cleanSender(payload.sender);
  const identity = safeText(payload.identity || (sender === "info@gnk-asg.hr" ? "owner" : "assistant"), 80);
  const mode = safeText(payload.mode || "batch_send", 80);
  const campaign = safeText(payload.campaign || "", 240);
  const label = safeText(payload.label || "", 240);
  const problems = [];
  if (!sender || !EMAIL_RE.test(sender)) problems.push("Invalid sender.");
  if (!ALLOWED_SENDERS.has(sender)) problems.push("Sender is not allowed for this endpoint.");
  if (!recipients.length) problems.push("No recipients.");
  if (recipients.length > MAX_RECIPIENTS) problems.push("Too many recipients. Maximum is 30.");
  if (invalid.length) problems.push("Invalid recipient address.");
  if (!subject) problems.push("Missing subject.");
  if (!body) problems.push("Missing body.");
  return { ok: problems.length === 0, problems, data: { recipients, sender, identity, subject, body, footer, mode, campaign, label } };
}

function envSafeDefaultSender() {
  return "it@gnk-asg.hr";
}

async function sendViaResend(env, data) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "authorization": `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: resendFrom(data.sender), to: data.recipients, subject: data.subject, text: `${data.body}\n\n${data.footer || ""}`.trim() })
  });
  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}
  return { ok: response.ok, provider: "resend", status: response.status, response: parsed };
}

async function sendViaBrevo(env, data) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ sender: { email: data.sender, name: senderName(data.sender) }, to: data.recipients.map(email => ({ email })), subject: data.subject, textContent: `${data.body}\n\n${data.footer || ""}`.trim() })
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

async function listLog(env, limit = 30) {
  if (!env.MAIL_LOG_KV || !env.MAIL_LOG_KV.list) return { ok: false, configured: false, items: [], reason: "MAIL_LOG_KV not bound" };
  const listed = await env.MAIL_LOG_KV.list({ prefix: "mail:", limit: Math.min(Math.max(limit, 1), 100) });
  const keys = (listed.keys || []).map(k => k.name).sort().reverse();
  const items = [];
  for (const key of keys.slice(0, limit)) {
    const raw = await env.MAIL_LOG_KV.get(key);
    if (!raw) continue;
    try { items.push({ key, ...JSON.parse(raw) }); } catch (_) { items.push({ key, raw }); }
  }
  return { ok: true, configured: true, count: items.length, items };
}

async function handleSend(request, env) {
  if (request.method === "GET") return json({ ok: true, endpoint: "mail-batch-send", methods: ["GET", "POST", "OPTIONS"], max_recipients: MAX_RECIPIENTS, allowed_senders: [...ALLOWED_SENDERS] });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);
  let payload;
  try { payload = await request.json(); } catch (_) { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const validation = validatePayload(payload);
  if (!validation.ok) return json({ ok: false, error: "Validation failed.", problems: validation.problems }, 400);
  const data = validation.data;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  let sendResult;
  if (env.RESEND_API_KEY) sendResult = await sendViaResend(env, data);
  else if (env.BREVO_API_KEY) sendResult = await sendViaBrevo(env, data);
  else sendResult = { ok: false, provider: "none", status: 500, response: "No outbound mail provider configured." };
  const entry = { id, created_at: createdAt, sent_at: sendResult.ok ? new Date().toISOString() : null, sender: data.sender, identity: data.identity, recipient_count: data.recipients.length, subject: data.subject, campaign: data.campaign, label: data.label, mode: data.mode, status: sendResult.ok ? (data.mode === "test_send" ? "test_sent" : "sent") : "failed", provider: sendResult.provider, provider_status: sendResult.status, operator: access.email || access.method, error_message: sendResult.ok ? "" : String(sendResult.response || "send failed").slice(0, 500) };
  const log = await writeLog(env, entry).catch(error => ({ ok: false, reason: error.message }));
  return json({ ok: sendResult.ok, id, sender: data.sender, identity: data.identity, provider: sendResult.provider, provider_status: sendResult.status, recipient_count: data.recipients.length, log, response: sendResult.response }, sendResult.ok ? 200 : 502);
}

async function handleLog(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "30");
  const result = await listLog(env, Number.isFinite(limit) ? limit : 30);
  return json({ ok: result.ok, endpoint: "mail-log-list", configured: result.configured, count: result.count || 0, items: result.items || [], reason: result.reason || "", operator: access.email || access.method });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/api/operator/mail-batch/send")) return handleSend(request, env);
    if (url.pathname.endsWith("/api/operator/mail-log/list")) return handleLog(request, env);
    return json({ ok: false, error: "Not found", path: url.pathname }, 404);
  }
};
