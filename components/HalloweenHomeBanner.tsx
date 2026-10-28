'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import styles from './HalloweenHomeBanner.module.css';

// 01/11/2026 00:00 en America/Argentina/Buenos_Aires (UTC-03:00).
const expiresAt=Date.parse('2026-11-01T00:00:00-03:00');

export default function HalloweenHomeBanner(){
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const refresh=()=>{
      clearTimeout(timer);
      const remaining=expiresAt-Date.now();
      setVisible(remaining>0);
      if(remaining>0)timer=setTimeout(refresh,Math.min(remaining,2147483647));
    };
    refresh();
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('pageshow',refresh);
    return ()=>{
      clearTimeout(timer);
      document.removeEventListener('visibilitychange',refresh);
      window.removeEventListener('pageshow',refresh);
    };
  },[]);

  if(!visible)return null;

  return <section className={styles.banner} aria-labelledby="halloween-home-title">
    <div className={styles.copy}>
      <h2 id="halloween-home-title">Halloween es este sábado 🎃</h2>
      <p>Más de 300 disfraces para alquilar, disfraces de niños a la venta y todo el cotillón para tu fiesta. Elegí online y consultanos por WhatsApp.</p>
    </div>
    <div className={styles.actions}>
      <Link className={styles.primary} href="/disfraces/">Ver disfraces</Link>
      <Link className={styles.secondary} href="/cotillon/">Cotillón de Halloween</Link>
    </div>
  </section>;
}
