const MAP = [
  { host: 'business.gnk-asg.hr', prefix: '/business', cache: 'public' },
  { host: 'front.gnk-asg.hr', prefix: '/front', cache: 'public' },
  { host: 'news.gnk-asg.hr', prefix: '/news', cache: 'public' },
  { host: 'market.gnk-asg.hr', prefix: '/market', cache: 'public' },
  { host: 'status.gnk-asg.hr', prefix: '/status-lite', cache: 'no-store' },
  { host: 'admin.gnk-asg.hr', prefix: '/operator/app', cache: 'no-store' },
  { host: 'operator.gnk-asg.hr', prefix: '/operator/app', cache: 'no-store' },
  { host: 'backend.gnk-asg.hr', prefix: '/backend', cache: 'no-store' },
  { host: 'app.gnk-asg.hr', prefix: '/app', cache: 'public' },
  { host: 'kontakt.gnk-asg.hr', prefix: '/kontakt', cache: 'public' },
  { host: 'mail.gnk-asg.hr', prefix: '/webmail', cache: 'no-store' }
];

function targetPath(host, path) {
  const item = MAP.find(x => x.host === host);
  if (!item) return { path, item: null };
  if (path === '/' || path === '') return { path: item.prefix + '/', item };
  return { path: item.prefix + path, item };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-gnk-asg-router': 'health'
    }
  });
}

function withHeaders(response, host, route, item) {
  const headers = new Headers(response.headers);
  headers.set('x-gnk-asg-subdomain-router', host);
  headers.set('x-gnk-asg-route', route || 'passthrough');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (item && item.cache === 'no-store') {
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
  } else if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=60');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (url.pathname === '/health' || url.pathname === '/__health') {
      const mapped = MAP.find(x => x.host === host);
      return json({
        status: 'ok',
        host,
        mapped_prefix: mapped ? mapped.prefix : null,
        cache_policy: mapped ? mapped.cache : 'passthrough',
        route_policy: 'subdomain router is read-only and rewrites to gnk-asg.hr path prefixes',
        supported_hosts: MAP.map(x => x.host),
        checked_at: new Date().toISOString()
      });
    }

    if (host === 'api.gnk-asg.hr') {
      url.hostname = 'gnk-asg.hr';
      if (!url.pathname.startsWith('/api/operator/')) {
        url.pathname = '/api/operator' + (url.pathname === '/' ? '/status' : url.pathname);
      }
      return withHeaders(await fetch(new Request(url.toString(), request)), host, '/api/operator', { cache: 'no-store' });
    }

    const mapped = targetPath(host, url.pathname);
    if (mapped.path !== url.pathname) {
      url.hostname = 'gnk-asg.hr';
      url.pathname = mapped.path;
      return withHeaders(await fetch(new Request(url.toString(), request)), host, mapped.path.split('/').slice(0,2).join('/') || '/', mapped.item);
    }

    return withHeaders(await fetch(request), host, 'passthrough', null);
  }
};
