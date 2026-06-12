export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const origin = 'https://gnk-asg.hr';
    const map = {
      'front.gnk-asg.hr': '/front/',
      'news.gnk-asg.hr': '/news/',
      'market.gnk-asg.hr': '/market/',
      'status.gnk-asg.hr': '/status-lite/',
      'backend.gnk-asg.hr': '/backend/',
      'admin.gnk-asg.hr': '/operator/app/',
      'operator.gnk-asg.hr': '/operator/app/',
      'app.gnk-asg.hr': '/app/',
      'kontakt.gnk-asg.hr': '/kontakt/',
      'mail.gnk-asg.hr': '/webmail/'
    };
    const base = map[host];
    if (!base) return fetch(request);
    let path = url.pathname;
    if (path === '/' || path === '') path = base;
    else path = base.replace(/\/$/, '') + path;
    const target = new URL(origin + path);
    target.search = url.search;
    const next = new Request(target.toString(), request);
    next.headers.set('x-gnk-asg-subdomain-router', host);
    const response = await fetch(next);
    const headers = new Headers(response.headers);
    headers.set('x-gnk-asg-route', base);
    headers.set('cache-control', headers.get('cache-control') || 'public, max-age=60');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
