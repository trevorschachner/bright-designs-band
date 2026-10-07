// 4x4 grid of "marchers" pulsing in a diagonal wave (CSS keyframes in globals.css).
export function MarchingFormationLoader({ className = '' }: { className?: string }) {
  const rows = 4;
  const cols = 4;
  const dots = Array.from({ length: rows * cols });

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
      >
        {dots.map((_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;

          return (
            <div
              key={i}
              className="marcher-dot w-3 h-3 rounded-full bg-primary"
              style={{ animationDelay: `${(row + col) * 0.1}s` }}
            />
          );
        })}
      </div>
    </div>
  );
}
