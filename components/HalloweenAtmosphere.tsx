'use client';

import {useEffect, useRef} from 'react';

/** Decorative layers only. Scroll work is limited to one animation frame and never rerenders React. */
export default function HalloweenAtmosphere() {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scene.current;
    if (!element) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const footer = document.querySelector<HTMLElement>('.site-footer');
    let frame = 0;

    const paint = () => {
      frame = 0;
      if (document.documentElement.dataset.theme !== 'halloween') return;

      const distance = window.scrollY;
      const endIsNear = footer ? footer.getBoundingClientRect().top < window.innerHeight * 1.25 : false;
      const zone = distance < Math.max(380, window.innerHeight * .55)
        ? 'intro'
        : endIsNear ? 'closing' : 'catalog';
      if (element.dataset.zone !== zone) element.dataset.zone = zone;

      if (preference.matches) {
        element.style.setProperty('--h-far-x', '0px');
        element.style.setProperty('--h-far-y', '0px');
        element.style.setProperty('--h-near-x', '0px');
        element.style.setProperty('--h-near-y', '0px');
        element.style.setProperty('--h-bat-x', '0px');
        element.style.setProperty('--h-bat-y', '0px');
        return;
      }

      // Bounded, cyclic motion keeps the scene alive even through very long catalogs.
      element.style.setProperty('--h-far-x', `${Math.round(Math.sin(distance / 840) * 22)}px`);
      element.style.setProperty('--h-far-y', `${Math.round(Math.sin(distance / 680) * 18)}px`);
      element.style.setProperty('--h-near-x', `${Math.round(Math.sin(distance / 510 + 1) * 42)}px`);
      element.style.setProperty('--h-near-y', `${Math.round(Math.sin(distance / 390) * 24)}px`);
      element.style.setProperty('--h-bat-x', `${Math.round(Math.sin(distance / 750) * 34)}px`);
      element.style.setProperty('--h-bat-y', `${Math.round(Math.sin(distance / 570) * 18)}px`);
    };

    const queuePaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const themeObserver = new MutationObserver(queuePaint);
    themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    window.addEventListener('scroll', queuePaint, {passive: true});
    window.addEventListener('resize', queuePaint, {passive: true});
    preference.addEventListener('change', queuePaint);
    queuePaint();

    return () => {
      window.removeEventListener('scroll', queuePaint);
      window.removeEventListener('resize', queuePaint);
      preference.removeEventListener('change', queuePaint);
      themeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <>
    <div className="halloween-atmosphere" data-zone="intro" aria-hidden="true" ref={scene}>
      <div className="halloween-atmosphere__texture" />
      <div className="halloween-atmosphere__far" />
      <div className="halloween-atmosphere__bats" />
      <div className="halloween-atmosphere__near" />
      <div className="halloween-atmosphere__shade" />
    </div>
    <div className="halloween-rails" aria-hidden="true" />
  </>;
}
