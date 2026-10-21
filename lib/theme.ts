export type SiteTheme = 'default' | 'halloween';

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === 'default' || value === 'halloween';
}

// La primera implementación de Apps Script respondió un string; aceptamos
// también el objeto de las implementaciones corregidas.
export function readSiteTheme(value: unknown): SiteTheme | null {
  const candidate = typeof value === 'object' && value !== null && 'theme' in value ? value.theme : value;
  return isSiteTheme(candidate) ? candidate : null;
}

export function applySiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('dc-site-theme', theme); } catch { /* El servidor sigue siendo la fuente de verdad. */ }
}
