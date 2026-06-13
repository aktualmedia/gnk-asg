function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function getAccessIdentity(request, env) {
  const email = request.headers.get("cf-access-authenticated-user-email") || "";
  const jwt = request.headers.get("cf-access-jwt-assertion") || "";
  if (email || jwt) return { ok: true, method: "cloudflare_access", email };
  if (env.OPERATOR_ALLOW_NO_ACCESS === "true") return { ok: true, method: "env_override", email: "operator" };
  return { ok: false, method: "none", email: "" };
}

async function readMailLog(env, limit) {
  if (!env.MAIL_LOG_KV || !env.MAIL_LOG_KV.list) {
    return { ok: false, configured: false, items: [], reason: "MAIL_LOG_KV not bound" };
  }

  const listed = await env.MAIL_LOG_KV.list({ prefix: "mail:", limit: Math.min(Math.max(limit, 1), 100) });
  const keys = (listed.keys || []).map(k => k.name).sort().reverse();
  const items = [];

  for (const key of keys.slice(0, limit)) {
    const raw = await env.MAIL_LOG_KV.get(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      items.push({ key, ...parsed });
    } catch (_) {
      items.push({ key, raw });
    }
  }

  return { ok: true, configured: true, count: items.length, items };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const access = getAccessIdentity(request, env);
  if (!access.ok) return json({ ok: false, error: "Unauthorized operator request." }, 401);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "30");
  const result = await readMailLog(env, Number.isFinite(limit) ? limit : 30);

  return json({
    ok: result.ok,
    endpoint: "mail-log-list",
    configured: result.configured,
    count: result.count || 0,
    items: result.items || [],
    reason: result.reason || "",
    operator: access.email || access.method
  }, result.ok ? 200 : 200);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
