const DEFAULT_NOTIFY_TO = "rht@gmx.com";
const DEFAULT_REPLY_FROM = "it@gnk-asg.hr";

function safeText(value, max = 20000) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, max);
}

function header(message, name) {
  try {
    return message.headers.get(name) || "";
  } catch (_) {
    return "";
  }
}

async function readBody(message) {
  try {
    if (!message.raw) return "";
    const text = await new Response(message.raw).text();
    return safeText(text, 30000);
  } catch (_) {
    return "";
  }
}

function hasAny(text, words) {
  return words.some(word => text.includes(word));
}

function classify(subject, body) {
  const t = `${subject}\n${body}`.toLowerCase();
  if (hasAny(t, ["odvjet", "ugovor", "tuž", "sud", "kaznen", "prav", "žalba", "spor", "opomena", "potraživanje"])) {
    return { label: "legal_sensitive", review_required: true, template: "review", reason: "Moguća pravna ili sporna tema." };
  }
  if (hasAny(t, ["račun", "uplata", "iban", "porez", "invest", "kredit", "dug", "financ", "plaćanje", "isplata"])) {
    return { label: "financial_sensitive", review_required: true, template: "review", reason: "Moguća financijska ili porezna tema." };
  }
  if (hasAny(t, ["novinar", "medij", "izjava", "intervju", "objava", "demanti"])) {
    return { label: "media_sensitive", review_required: true, template: "review", reason: "Mogući medijski upit." };
  }
  if (hasAny(t, ["osobni podatak", "gdpr", "lozinka", "token", "pristup", "privitak", "dokument", "povjerljivo"])) {
    return { label: "personal_or_confidential", review_required: true, template: "review", reason: "Mogući osobni ili povjerljivi podaci." };
  }
  if (hasAny(t, ["objave autora", "autor", "insights", "članak", "clanak"])) {
    return { label: "author_posts", review_required: false, template: "posts", reason: "Upit o objavama autora." };
  }
  if (hasAny(t, ["bitcoin", "burza", "tržište", "trziste", "market", "zlato", "brent", "digitalna imovina"])) {
    return { label: "market_data", review_required: false, template: "market", reason: "Upit o tržišnim podacima." };
  }
  if (hasAny(t, ["kontakt", "upit", "informacija", "portal", "gnk asg", "web", "stranica"])) {
    return { label: "general_info", review_required: false, template: "receipt", reason: "Opći informativni upit." };
  }
  return { label: "unknown", review_required: true, template: "review", reason: "Namjera poruke nije dovoljno jasna." };
}

function draftFor(classification) {
  const signature = "IT – Osobni digitalni asistent\nGNK ASG d.o.o.\nhttps://gnk-asg.hr";
  if (classification.template === "posts") {
    return `Poštovani,\n\nobjave autora dostupne su na stranici:\nhttps://gnk-asg.hr/insights-hr/\n\n${signature}`;
  }
  if (classification.template === "market") {
    return `Poštovani,\n\ntržišni i digitalni podaci na portalu GNK ASG prikazuju se informativno. Mogu biti označeni kao live, snapshot, delayed ili fallback, ovisno o dostupnosti izvora i trenutnom statusu ažuriranja. Ti podaci nisu financijski, investicijski, porezni ili pravni savjet.\n\n${signature}`;
  }
  if (classification.template === "review") {
    return `Poštovani,\n\nzahvaljujemo na poruci. Ovaj upit traži pregled ovlaštene osobe jer može sadržavati pravna, financijska, ugovorna, medijska, osobna ili druga osjetljiva pitanja. Zbog toga nećemo davati automatski sadržajni odgovor prije provjere.\n\n${signature}`;
  }
  return `Poštovani,\n\nzahvaljujemo na poruci. Vaš upit je zaprimljen. Ako se radi o općem informativnom upitu, odgovor se priprema na temelju javno dostupnih informacija portala GNK ASG. Ako se radi o pravnoj, financijskoj, ugovornoj, medijskoj ili drugoj osjetljivoj temi, poruka ide na pregled ovlaštene osobe.\n\n${signature}`;
}

async function sendViaResend(env, message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(message)
  });
  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}
  return { ok: response.ok, status: response.status, provider: "resend", response: parsed };
}

async function sendViaBrevo(env, message) {
  const from = message.from.match(/<([^>]+)>/)?.[1] || message.from;
  const name = message.from.includes("<") ? message.from.split("<")[0].trim() : "GNK ASG";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: from, name },
      to: message.to.map(email => ({ email })),
      subject: message.subject,
      textContent: message.text
    })
  });
  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}
  return { ok: response.ok, status: response.status, provider: "brevo", response: parsed };
}

async function outbound(env, message) {
  if (env.RESEND_API_KEY) return sendViaResend(env, message);
  if (env.BREVO_API_KEY) return sendViaBrevo(env, message);
  return { ok: false, provider: "none", status: 500, response: "No outbound provider configured." };
}

async function log(env, entry) {
  if (!env.IT_MAIL_LOG_KV || !env.IT_MAIL_LOG_KV.put) return;
  const key = `inbound:${entry.created_at}:${entry.id}`;
  await env.IT_MAIL_LOG_KV.put(key, JSON.stringify(entry, null, 2));
}

function notificationText(entry, originalBody) {
  return `GNK ASG IT inbound mail\n\nStatus: ${entry.status}\nClassification: ${entry.classification.label}\nReview required: ${entry.classification.review_required}\nReason: ${entry.classification.reason}\nFrom: ${entry.from}\nTo: ${entry.to}\nSubject: ${entry.subject}\nTime: ${entry.created_at}\n\nDraft reply:\n${entry.draft}\n\nOriginal excerpt:\n${safeText(originalBody, 3000)}`;
}

export default {
  async email(message, env, ctx) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const from = message.from || header(message, "from");
    const to = message.to || header(message, "to") || DEFAULT_REPLY_FROM;
    const subject = header(message, "subject") || "GNK ASG upit";
    const body = await readBody(message);
    const classification = classify(subject, body);
    const draft = draftFor(classification);
    const replyFrom = env.IT_REPLY_FROM || DEFAULT_REPLY_FROM;
    const notifyTo = env.IT_NOTIFY_TO || DEFAULT_NOTIFY_TO;
    const autoReplyEnabled = env.IT_AUTO_REPLY_ENABLED === "true";
    const entry = {
      id,
      created_at: createdAt,
      from,
      to,
      subject,
      classification,
      draft,
      status: classification.review_required ? "review_required" : "auto_reply_prepared"
    };

    const notify = {
      from: `IT – Osobni digitalni asistent <${replyFrom}>`,
      to: [notifyTo],
      subject: `[GNK ASG IT] ${classification.review_required ? "Pregled" : "Auto odgovor"}: ${safeText(subject, 160)}`,
      text: notificationText(entry, body)
    };

    const notifyResult = await outbound(env, notify);
    entry.notification = notifyResult;

    if (autoReplyEnabled && !classification.review_required && from) {
      const reply = {
        from: `IT – Osobni digitalni asistent <${replyFrom}>`,
        to: [from],
        subject: `Re: ${safeText(subject, 180)}`,
        text: draft
      };
      entry.auto_reply = await outbound(env, reply);
      entry.status = entry.auto_reply.ok ? "auto_replied" : "auto_reply_failed";
    }

    ctx.waitUntil(log(env, entry));
  }
};
