'use client';

import { useEffect, useRef } from 'react';
import { SETS, positionsAt } from '@/lib/drill/show';

/** Matches the field grid in GlobalBackground. */
const GRID = 40;
const DOT_RADIUS = 3;
/** Slightly stronger than the grid lines (4%), so the drill reads on a second look, not the first. */
const DOT_ALPHA = 0.11;

/**
 * Performer dots marching the background drill (lib/drill/show.ts) on the
 * field grid. One canvas, redrawn each frame while visible; requestAnimationFrame
 * stops on hidden tabs. With reduced motion it draws the opening set once.
 */
export function DrillField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let colour = '';
    let colourCheckedAt = -Infinity;

    // The brand navy; the theme can change while the page is open, so it is re-read every few seconds.
    const readColour = () => {
      const dark = document.documentElement.classList.contains('dark');
      const probe = document.createElement('span');
      probe.style.color = dark ? 'hsl(var(--foreground))' : 'hsl(var(--secondary))';
      document.body.appendChild(probe);
      colour = getComputedStyle(probe).color;
      probe.remove();
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (spots: readonly (readonly [number, number])[]) => {
      // Centre on a grid line, low enough to sit under the hero buttons rather than its text.
      const cx = Math.round(window.innerWidth / 2 / GRID) * GRID;
      const cy = Math.round((window.innerHeight * 0.6) / GRID) * GRID;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = DOT_ALPHA;
      ctx.fillStyle = colour;
      ctx.beginPath();
      for (const [x, y] of spots) {
        const px = cx + x * GRID;
        const py = cy + y * GRID;
        ctx.moveTo(px + DOT_RADIUS, py);
        ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const tick = (now: number) => {
      if (now - colourCheckedAt > 3000) {
        readColour();
        colourCheckedAt = now;
      }
      draw(positionsAt(now / 1000));
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      resize();
      if (reduced.matches) {
        readColour();
        draw(SETS[0]);
      } else {
        frame = requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      resize();
      if (reduced.matches) draw(SETS[0]);
    };

    start();
    window.addEventListener('resize', onResize);
    reduced.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      reduced.removeEventListener('change', start);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}
    />
  );
}
