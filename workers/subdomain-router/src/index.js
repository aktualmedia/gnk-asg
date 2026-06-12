const MAP = [
  { host: 'business.gnk-asg.hr', prefix: '/business' },
  { host: 'front.gnk-asg.hr', prefix: '/front' },
  { host: 'news.gnk-asg.hr', prefix: '/news' },
  { host: 'market.gnk-asg.hr', prefix: '/market' },
  { host: 'status.gnk-asg.hr', prefix: '/status-lite' },
  { host: 'admin.gnk-asg.hr', prefix: '/operator/app' },
  { host: 'operator.gnk-asg.hr', prefix: '/operator/app' },
  { host: 'backend.gnk-asg.hr', prefix: '/backend' },
  { host: 'app.gnk-asg.hr', prefix: '/app' },
  { host: 'kontakt.gnk-asg.hr', prefix: '/kontakt' },
  { host: 'mail.gnk-asg.hr', prefix: '/webmail' }
];

function targetPath(host, path) {
  const item = MAP.find(x => x.host === host);
  if (!item) return path;
  if (path === '/' || path === '') return item.prefix + '/';
  return item.prefix + path;
}

function withHeaders(response, host, route) {
  const headers = new Headers(response.headers);
  headers.set('x-gnk-asg-subdomain-router', host);
  headers.set('x-gnk-asg-route', route || 'passthrough');
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=60');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === 'api.gnk-asg.hr') {
      url.hostname = 'gnk-asg.hr';
      if (!url.pathname.startsWith('/api/operator/')) {
        url.pathname = '/api/operator' + (url.pathname === '/' ? '/status' : url.pathname);
      }
      return withHeaders(await fetch(new Request(url.toString(), request)), host, '/api/operator');
    }

    const mapped = targetPath(host, url.pathname);
    if (mapped !== url.pathname) {
      url.hostname = 'gnk-asg.hr';
      url.pathname = mapped;
      return withHeaders(await fetch(new Request(url.toString(), request)), host, mapped.split('/').slice(0,2).join('/') || '/');
    }

    return fetch(request);
  }
};
