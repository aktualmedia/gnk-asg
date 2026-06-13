const REQUIRED = ["type", "status", "author", "title", "slug", "summary", "body", "target"];
const TYPES = new Set(["author_post", "business_news", "market_brief", "document_note"]);
const STATUSES = new Set(["draft", "ready_for_review", "ready_to_publish"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function safeText(value, max = 20000) {
  return String(value || "").trim().slice(0, max);
}

function getAccessIdentity(request, env) {
  const email = request.headers.get("cf-access-authenticated-user-email") || "";
  const jwt = request.headers.get("cf-access-jwt-assertion") || "";
  if (email || jwt) return { ok: true, method: "cloudflare_access", email };
  if (env.OPERATOR_ALLOW_NO_ACCESS === "true") return { ok: true, method: "env_override", email: "operator" };
  return { ok: false, method: "none", email: "" };
}

function slugify(value) {
  return safeText(value, 140).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

function validate(payload) {
  const problems = [];
  for (const field of REQUIRED) if (!safeText(payload[field])) problems.push(`Missing field: ${field}`);
  const type = safeText(payload.type, 80);
  const status = safeText(payload.status, 80);
  if (type && !TYPES.has(type)) problems.push("Unsupported content type.");
  if (status && !STATUSES.has(status)) problems.push("Unsupported content status.");
  const body = safeText(payload.body, 50000);
  const wordCount = body ? body.split(/\s+/).filter(Boolean).length : 0;
  if (type === "author_post" && wordCount < 120) problems.push("Author post body is too short for publishing package.");
  const title = safeText(payload.title, 220);
  const slug = slugify(payload.slug || title);
  const keywords = Array.isArray(payload.keywords) ? payload.keywords.map(x => safeText(x, 80)).filter(Boolean).slice(0, 30) : [];
  const data = {
    type,
    status,
    author: safeText(payload.author, 160),
    title,
    slug,
    summary: safeText(payload.summary, 2000),
    body,
    seo_description: safeText(payload.seo_description, 300),
    keywords,
    image: safeText(payload.image, 500),
    target: safeText(payload.target, 300),
    word_count: wordCount,
    requires_review: payload.requires_review !== false || status !== "ready_to_publish"
  };
  return { ok: problems.length === 0, problems, data };
}

async function save(env, entry) {
  if (!env.CONTENT_DRAFT_KV || !env.CONTENT_DRAFT_KV.put) return { ok: false, reason: "CONTENT_DRAFT_KV not bound" };
  const key = `content:${entry.status}:${entry.created_at}:${entry.slug}`;
  await env.CONTENT_DRAFT_KV.put(key, JSON.stringify(entry, null, 2));
  return { ok: true, key };
}

async function list(env, limit = 30) {
  if (!env.CONTENT_DRAFT_KV || !env.CONTENT_DRAFT_KV.list) return { ok: false, configured: false, reason: "CONTENT_DRAFT_KV not bound", items: [] };
  const result = await env.CONTENT_DRAFT_KV.list({ prefix: "content:", limit: Math.min(Math.max(limit, 1), 100) });
  const keys = (result.keys || []).map(k => k.name).sort().reverse();
  const items = [];
  for (const key of keys.slice(0, limit)) {
    const raw = await env.CONTENT_DRAFT_KV.get(key);
    if (!raw) continue;
    try { items.push({ key, ...JSON.parse(raw) }); } catch (_) { items.push({ key, raw }); }
  }
  return { ok: true, configured: true, count: items.length, items };
}

async function publish(request, env) {
  if (request.method === "GET") return json({ ok: true, endpoint: "content-publish", methods: ["GET", "POST", "OPTIONS"], storage: "CONTENT_DRAFT_KV" });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);
  let payload;
  try { payload = await request.json(); } catch (_) { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const validation = validate(payload);
  if (!validation.ok) return json({ ok: false, error: "Validation failed.", problems: validation.problems }, 400);
  const entry = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    operator: access.email || access.method,
    ...validation.data,
    public_path: `${validation.data.target.replace(/\/$/, "")}/${validation.data.slug}/`,
    backend_state: validation.data.status === "ready_to_publish" ? "ready_item_stored" : "draft_item_stored"
  };
  const stored = await save(env, entry).catch(error => ({ ok: false, reason: error.message }));
  return json({ ok: stored.ok, endpoint: "content-publish", stored, item: entry }, stored.ok ? 200 : 503);
}

async function listHandler(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "30");
  const result = await list(env, Number.isFinite(limit) ? limit : 30);
  return json({ endpoint: "content-list", operator: access.email || access.method, ...result });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/api/operator/content/publish")) return publish(request, env);
    if (url.pathname.endsWith("/api/operator/content/list")) return listHandler(request, env);
    return json({ ok: false, error: "Not found", path: url.pathname }, 404);
  }
};
