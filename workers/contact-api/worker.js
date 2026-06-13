export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://gnk-asg.hr',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/api/contact/status' && request.method === 'GET') {
      return json({ ok: true, service: 'gnk-asg-contact-api', status: 'active', mode: 'store_only' }, 200, corsHeaders);
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env, corsHeaders);
    }

    if (url.pathname === '/api/contact/list' && request.method === 'GET') {
      return handleList(request, env, corsHeaders);
    }

    return json({ ok: false, error: 'not_found' }, 404, corsHeaders);
  }
};

async function handleContact(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'invalid_json' }, 400, corsHeaders);
  }

  const required = ['name', 'email', 'topic', 'message'];
  const missing = required.filter((field) => !clean(body[field]));
  if (missing.length) {
    return json({ ok: false, error: 'missing_fields', fields: missing }, 400, corsHeaders);
  }

  if (String(body.privacy_consent || '').toLowerCase() !== 'true') {
    return json({ ok: false, error: 'privacy_consent_required' }, 400, corsHeaders);
  }

  const now = new Date().toISOString();
  const id = 'contact_' + now.replace(/[^0-9]/g, '') + '_' + crypto.randomUUID().slice(0, 8);
  const ipHash = await sha256(request.headers.get('CF-Connecting-IP') || 'unknown');

  const record = {
    id,
    received_at: now,
    source: 'gnk-asg.hr/kontakt',
    status: 'received',
    mode: 'store_only_no_automatic_substantive_reply',
    human_approval_required: true,
    ip_hash: ipHash,
    user_agent: (request.headers.get('User-Agent') || '').slice(0, 280),
    name: clean(body.name).slice(0, 160),
    email: clean(body.email).slice(0, 180),
    phone: clean(body.phone).slice(0, 80),
    company: clean(body.company).slice(0, 180),
    request_type: clean(body.request_type || 'opci_upit').slice(0, 80),
    preferred_channel: clean(body.preferred_channel || 'email').slice(0, 60),
    topic: clean(body.topic).slice(0, 220),
    message: clean(body.message).slice(0, 6000),
    safety_note: 'AL/AI may prepare a draft only. Legal, financial, media, court, contract and sensitive matters require human approval.'
  };

  if (!env.CONTACT_MESSAGES) {
    return json({ ok: false, error: 'kv_not_bound' }, 500, corsHeaders);
  }

  await env.CONTACT_MESSAGES.put(id, JSON.stringify(record, null, 2), {
    metadata: {
      received_at: now,
      email: record.email,
      request_type: record.request_type,
      status: 'received'
    }
  });

  return json({
    ok: true,
    id,
    status: 'received',
    message_hr: 'Vaš upit je zaprimljen. Ako se upit odnosi na pravna, financijska, osobna ili druga osjetljiva pitanja, odgovor daje ovlaštena osoba nakon provjere.',
    mode: 'store_only'
  }, 200, corsHeaders);
}

async function handleList(request, env, corsHeaders) {
  const auth = request.headers.get('Authorization') || '';
  const expected = env.CONTACT_ADMIN_TOKEN ? 'Bearer ' + env.CONTACT_ADMIN_TOKEN : '';
  if (!expected || auth !== expected) {
    return json({ ok: false, error: 'unauthorized' }, 401, corsHeaders);
  }
  if (!env.CONTACT_MESSAGES) {
    return json({ ok: false, error: 'kv_not_bound' }, 500, corsHeaders);
  }
  const list = await env.CONTACT_MESSAGES.list({ prefix: 'contact_', limit: 25 });
  return json({ ok: true, count: list.keys.length, keys: list.keys }, 200, corsHeaders);
}

function clean(value) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}
