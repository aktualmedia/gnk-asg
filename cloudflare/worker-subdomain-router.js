const ORIGIN = 'https://aktualmedia.github.io/gnk-asg';

const ROUTES = {
  'media.gnk-asg.hr': '/media-kit',
  'news.gnk-asg.hr': '/news',
  'status.gnk-asg.hr': '/status',
  'operator.gnk-asg.hr': '/operator',
  'data.gnk-asg.hr': '/data',
  'assistant.gnk-asg.hr': '/assistant'
};

function withSecurityHeaders(response, host) {
  const headers = new Headers(response.headers);
  headers.set('x-gnk-asg-router', 'cloudflare-subdomain-router-v1');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (host === 'operator.gnk-asg.hr') {
    headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    headers.set('cache-control', 'no-store');
  }
  if (host === 'data.gnk-asg.hr') {
    headers.set('access-control-allow-origin', '*');
    headers.set('cache-control', 'public, max-age=60, stale-while-revalidate=300');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function mapUrl(request) {
  const input = new URL(request.url);
  const base = ROUTES[input.hostname];
  if (!base) return null;

  let pathname = input.pathname || '/';
  if (pathname === '/') pathname = '/';
  const mapped = new URL(ORIGIN + base + pathname);
  mapped.search = input.search;
  return mapped;
}

export default {
  async fetch(request) {
    const host = new URL(request.url).hostname;
    const mapped = mapUrl(request);
    if (!mapped) return new Response('GNK ASG router: unknown host', { status: 404 });

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, HEAD, OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }

    const upstream = await fetch(mapped.toString(), {
      method: request.method,
      headers: {
        'user-agent': 'GNK-ASG-Subdomain-Router/1.0',
        'accept': request.headers.get('accept') || '*/*'
      },
      cf: { cacheTtl: host === 'operator.gnk-asg.hr' ? 0 : 120, cacheEverything: host !== 'operator.gnk-asg.hr' }
    });
    return withSecurityHeaders(upstream, host);
  }
};
