const MAP = [
  { host: 'front.gnk-asg.hr', prefix: '/front' },
  { host: 'news.gnk-asg.hr', prefix: '/news' },
  { host: 'admin.gnk-asg.hr', prefix: '/operator/app' },
  { host: 'backend.gnk-asg.hr', prefix: '/backend' },
  { host: 'app.gnk-asg.hr', prefix: '/app' }
];

function targetPath(host, path) {
  const item = MAP.find(x => x.host === host);
  if (!item) return path;
  if (path === '/' || path === '') return item.prefix + '/';
  return item.prefix + path;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    if (host === 'api.gnk-asg.hr') {
      url.hostname = 'gnk-asg.hr';
      if (!url.pathname.startsWith('/api/operator/')) url.pathname = '/api/operator' + (url.pathname === '/' ? '/status' : url.pathname);
      return fetch(new Request(url.toString(), request));
    }
    const mapped = targetPath(host, url.pathname);
    if (mapped !== url.pathname) {
      url.hostname = 'gnk-asg.hr';
      url.pathname = mapped;
      return fetch(new Request(url.toString(), request));
    }
    return fetch(request);
  }
};
