import { DrillField } from './drill-field';

// Field-grid backdrop. The grid is server-rendered; the drill on it is a
// client canvas (DrillField).
export function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none bg-background">
      {/* 1. The Field Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          color: 'var(--secondary)' /* Use Midnight Blue for grid lines instead of current text color */
        }}
      />
      {/* 2. The drill on it */}
      <DrillField />
    </div>
  );
}
