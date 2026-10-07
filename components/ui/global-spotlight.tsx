'use client';

import { useEffect, useRef } from 'react';

/** Cursor glow: pointer position goes into CSS custom properties, no React state. */
export function GlobalSpotlight({ color = 'rgba(234, 179, 8, 0.1)' }: { color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = ref.current!.style;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      s.setProperty('--spot-x', `${e.clientX}px`);
      s.setProperty('--spot-y', `${e.clientY}px`);
      s.opacity = '1';
    };
    const leave = () => { s.opacity = '0'; };
    window.addEventListener('pointermove', move, { passive: true });
    document.body.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] opacity-0 transition-opacity duration-300 hidden md:block"
      style={{ background: `radial-gradient(600px circle at var(--spot-x, 0px) var(--spot-y, 0px), ${color}, transparent 40%)` }}
    />
  );
}
