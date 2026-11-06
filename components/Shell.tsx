'use client';

import {useEffect, useState} from 'react';
import {Menu, X, ArrowUpRight} from 'lucide-react';
import Link from 'next/link';
import {api, demo, whatsapp} from '@/lib/api';
import {applySiteTheme, isSiteTheme, readSiteTheme} from '@/lib/theme';
import HalloweenAtmosphere from '@/components/HalloweenAtmosphere';
import GlobalSearch from './GlobalSearch';
import PublicAnalytics from './PublicAnalytics';
import SiteInfoProvider from './SiteInfoProvider';
import VisitUs from './VisitUs';
import CartProvider,{StoreActions} from '@/components/CartProvider';

export default function Shell({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (demo) {if (!document.documentElement.dataset.theme) applySiteTheme('default'); return;}
    let alive = true;
    const sync = () => api('siteTheme')
      .then(result => {
        const theme = readSiteTheme(result);
        if (alive && theme && document.documentElement.dataset.themePreview !== 'true') applySiteTheme(theme);
      })
      .catch(() => {})
      .finally(() => {if (alive && !document.documentElement.dataset.theme) applySiteTheme('default');});
    sync();
    const onVisible = () => {if (document.visibilityState === 'visible') sync();};
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'dc-site-theme' && isSiteTheme(event.newValue) && document.documentElement.dataset.themePreview !== 'true') {
        document.documentElement.dataset.theme = event.newValue;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <CartProvider><SiteInfoProvider>
    <PublicAnalytics />
    <HalloweenAtmosphere />
    <div className="site-shell">
      <div className="topbar">DISFRACES, COTILLÓN Y MUCHAS GANAS DE FESTEJAR <span>✦ Av. Rivadavia 3314 · CABA</span></div>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Disfraz Cabezón, inicio">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-copy">Disfraz<strong>Cabezón</strong></span>
        </Link>
        <GlobalSearch/>
        <button className="menu-button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'open' : ''} onClick={() => setOpen(false)}>
          <Link href="/disfraces/">Disfraces</Link>
          <Link href="/cotillon/">Cotillón</Link>
          <Link href="/reservas/">Reservá tu disfraz</Link>
          <a className="nav-contact" href={whatsapp()} target="_blank" rel="noreferrer">Hablemos <ArrowUpRight size={17} /></a>
        </nav>
      </header>
      <StoreActions />
      {children}
      <footer className="site-footer">
        <div>
          <Link className="wordmark footer-brand" href="/" aria-label="Disfraz Cabezón, inicio">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-copy">Disfraz<strong>Cabezón</strong></span>
          </Link>
          <p>Hay un personaje para cada historia.<br />Y una fiesta esperando la tuya.</p>
        </div>

        <div>
          <Link href="/condiciones/">Condiciones y privacidad</Link>
          <Link href="/arrepentimiento/">Solicitud de arrepentimiento</Link>
        </div>
        <VisitUs compact/><small>© {new Date().getFullYear()} Disfraz Cabezón · Hecho para celebrar.</small>
      </footer>
    </div>
  </SiteInfoProvider></CartProvider>;
}
