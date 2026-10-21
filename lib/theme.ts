export type SiteTheme = 'default' | 'halloween';

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === 'default' || value === 'halloween';
}

export function applySiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('dc-site-theme', theme); } catch { /* El servidor sigue siendo la fuente de verdad. */ }
}
