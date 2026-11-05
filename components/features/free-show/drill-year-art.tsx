// A drill chart drawn the way OpenMarch draws one: white indoor floor, step
// grid with checkpoint lines, red marcher dots labelled in bold Courier.
// Twenty-five winds marchers move from a block (set 1) to "27" (set 2) and
// back, linearly over counts, as OpenMarch playback does. Timing lives in globals.css (.drill-*); under
// prefers-reduced-motion the chart holds on set 2.

const STEP = 16
const COLS = 28
const ROWS = 16
const CHECKPOINT = 4
const PAD = 24

const DIGITS: Record<string, string[]> = {
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
}

// Set 2: the year, two steps between dots, starting at step (3, 2).
const target = ["2", "7"]
  .flatMap((digit, d) =>
    DIGITS[digit].flatMap((line, row) =>
      [...line].flatMap((cell, col) =>
        cell === "#" ? [{ col: 3 + (d * 6 + col) * 2, row: 2 + row * 2 }] : []
      )
    )
  )
  .sort((a, b) => a.col - b.col || a.row - b.row)

// Set 1: a 5x5 block, two steps between dots, centred.
const block = Array.from({ length: 25 }, (_, i) => ({ col: 10 + Math.floor(i / 5) * 2, row: 4 + (i % 5) * 2 }))

// Who goes where: swap destinations while that shortens the total squared
// path length. A minimum here has no crossing paths, as a drill writer would
// want.
const dist = (a: { col: number; row: number }, b: { col: number; row: number }) =>
  (a.col - b.col) ** 2 + (a.row - b.row) ** 2
const start = target.map((_, i) => i)
for (let improved = true; improved; ) {
  improved = false
  for (let i = 0; i < start.length; i++) {
    for (let j = i + 1; j < start.length; j++) {
      const now = dist(block[start[i]], target[i]) + dist(block[start[j]], target[j])
      const swapped = dist(block[start[j]], target[i]) + dist(block[start[i]], target[j])
      if (swapped < now) {
        ;[start[i], start[j]] = [start[j], start[i]]
        improved = true
      }
    }
  }
}

const x = (col: number) => PAD + col * STEP
const y = (row: number) => PAD + row * STEP

const marchers = target.map((to, i) => {
  const from = block[start[i]]
  return {
    label: `W${i + 1}`,
    to: { x: x(to.col), y: y(to.row) },
    from: { x: x(from.col), y: y(from.row) },
  }
})

export function DrillYearArt({ className = "" }: { className?: string }) {
  const width = COLS * STEP + PAD * 2
  const height = ROWS * STEP + PAD * 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Drill chart: twenty-five marchers move from a block into the number 27"
    >
      <rect width={width} height={height} fill="#FFFFFF" />
      {/* Step grid */}
      {Array.from({ length: COLS + 1 }, (_, c) => (
        <line key={`c${c}`} x1={x(c)} y1={y(0)} x2={x(c)} y2={y(ROWS)} stroke={c % CHECKPOINT ? "#DDDDDD" : "#000000"} strokeWidth={1} />
      ))}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line key={`r${r}`} x1={x(0)} y1={y(r)} x2={x(COLS)} y2={y(r)} stroke={r % CHECKPOINT ? "#DDDDDD" : "#000000"} strokeWidth={1} />
      ))}
      <rect x={x(0)} y={y(0)} width={COLS * STEP} height={ROWS * STEP} fill="none" stroke="#000000" strokeWidth={3} />

      {/* Marchers, drawn at set 2 and offset back to set 1 by the animation */}
      {marchers.map(({ label, from, to }) => (
        <g
          key={label}
          className="drill-marcher"
          style={{
            ["--dx" as string]: `${from.x - to.x}px`,
            ["--dy" as string]: `${from.y - to.y}px`,
          }}
        >
          <circle cx={to.x} cy={to.y} r={5} fill="#FF0000" />
          <text
            x={to.x}
            y={to.y - 11}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily='"courier new", monospace'
            fontWeight="bold"
            fontSize={9}
            fill="#000000"
          >
            {label}
          </text>
        </g>
      ))}

      <text x={x(COLS)} y={height - 8} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize={10} fill="#888888">
        SET 1 → 2 · 8 COUNTS · ♩ = 120
      </text>
    </svg>
  )
}
