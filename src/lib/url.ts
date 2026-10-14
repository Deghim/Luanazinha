const configuredBase = import.meta.env.BASE_URL || '/';

export const siteBase = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

export function withBase(path: string): string {
  if (!path || path === '/') return siteBase;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|data:)/i.test(path) || path.startsWith('#')) return path;
  return `${siteBase}${path.replace(/^\/+/, '')}`;
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(withBase(path), site).toString();
}
