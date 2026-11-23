/**
 * The background drill: a short designed show on the site's 40 px field grid.
 * Pure and client-safe. Positions are in grid units (one unit = one grid
 * square) from the field's centre, x to the right and y down.
 *
 * Timing follows a show at 120 bpm: each move is 8 counts, then a 4-count
 * hold. Two kinds of move:
 * - `slide`: straight paths. Who goes where is solved per move to minimise
 *   total squared travel, and paths chosen that way never cross.
 * - `turn`: curved paths around the field centre (pinwheels, a circle
 *   rotating and splitting into rings). Each performer keeps its place in the
 *   form and travels along an arc.
 */

export type Spot = readonly [x: number, y: number]
export type DrillSet = readonly Spot[]

export const PERFORMERS = 48
export const COUNT_SECONDS = 0.5 // 120 bpm
export const MOVE_COUNTS = 8
export const HOLD_COUNTS = 4

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const polar = (r: number, a: number): Spot => [Math.cos(a) * r, Math.sin(a) * r]

// --- Forms -------------------------------------------------------------------

/** 8 files by 6 ranks, two steps apart. */
const block = (): Spot[] =>
  range(PERFORMERS).map((i) => [((i % 8) - 3.5) * 0.7, (Math.floor(i / 8) - 2.5) * 0.7])

/** The block opened up into a staggered (checkerboard) block: every other rank shifted half an interval. */
const stagger = (): Spot[] =>
  range(PERFORMERS).map((i) => {
    const rank = Math.floor(i / 8)
    return [((i % 8) - 3.5) * 1.3 + (rank % 2 ? 0.65 : 0), (rank - 2.5) * 0.9]
  })

/** Two ranks across the field. */
const companyFront = (): Spot[] =>
  range(PERFORMERS).map((i) => [((i % 24) - 11.5) * 0.55, i < 24 ? -0.4 : 0.4])

/** The front bent into two concentric arcs opening downfield. */
const arcs = (): Spot[] =>
  range(PERFORMERS).map((i) => {
    const t = (i % 24) / 23
    const r = i < 24 ? 6.4 : 5.6
    return polar(r, Math.PI * (1.12 + 0.76 * t)).map((v, k) => (k ? v + 3.2 : v)) as unknown as Spot
  })

/** One circle around the centre. */
const circle = (): Spot[] => range(PERFORMERS).map((i) => polar(4.2, (i / PERFORMERS) * Math.PI * 2))

/** A four-point star: points on an outer ring, valleys on an inner one. */
const star = (): Spot[] =>
  range(PERFORMERS).map((i) => {
    const a = (i / PERFORMERS) * Math.PI * 2
    const r = 2.6 + 2.4 * Math.pow(Math.abs(Math.cos(2 * a)), 1.5)
    return polar(r, a)
  })

// --- Moves --------------------------------------------------------------------

type Move =
  | { kind: 'slide'; to: () => Spot[] }
  /** Rotate everyone by `angle` radians around the centre while moving to `radius(i)` (performer order around the form). */
  | { kind: 'turn'; angle: number; radius: (indexAroundForm: number, current: number) => number }

const SHOW: Move[] = [
  { kind: 'slide', to: stagger },
  { kind: 'slide', to: companyFront },
  { kind: 'slide', to: arcs },
  { kind: 'slide', to: circle },
  // Pinwheel a quarter turn while alternate performers drop to an inner ring.
  { kind: 'turn', angle: Math.PI / 2, radius: (k) => (k % 2 ? 2.8 : 4.6) },
  // Counter-turn back into one ring.
  { kind: 'turn', angle: -Math.PI / 4, radius: () => 4.2 },
  { kind: 'slide', to: star },
  { kind: 'slide', to: block },
]

// --- Assignment (Hungarian algorithm, minimum total squared distance) ----------

function assign(from: readonly Spot[], to: readonly Spot[]): number[] {
  const n = from.length
  const cost = (i: number, j: number) => (from[i][0] - to[j][0]) ** 2 + (from[i][1] - to[j][1]) ** 2
  const u = new Array(n + 1).fill(0)
  const v = new Array(n + 1).fill(0)
  const p = new Array(n + 1).fill(0)
  const way = new Array(n + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    p[0] = i
    let j0 = 0
    const minv = new Array(n + 1).fill(Infinity)
    const used = new Array(n + 1).fill(false)
    do {
      used[j0] = true
      const i0 = p[j0]
      let delta = Infinity
      let j1 = 0
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue
        const cur = cost(i0 - 1, j - 1) - u[i0] - v[j]
        if (cur < minv[j]) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta
          v[j] -= delta
        } else minv[j] -= delta
      }
      j0 = j1
    } while (p[j0] !== 0)
    do {
      const j1 = way[j0]
      p[j0] = p[j1]
      j0 = j1
    } while (j0)
  }
  const result = new Array(n)
  for (let j = 1; j <= n; j++) result[p[j] - 1] = j - 1
  return result // performer i goes to spot result[i]
}

// --- The show, precomputed per performer ------------------------------------------

type Segment = { from: Spot[]; to: Spot[]; turn: number }

function build(): { sets: Spot[][]; segments: Segment[] } {
  let current = block()
  const sets: Spot[][] = [current]
  const segments: Segment[] = []
  for (const move of SHOW) {
    let next: Spot[]
    let turn = 0
    if (move.kind === 'slide') {
      const spots = move.to()
      const order = assign(current, spots)
      next = current.map((_, i) => spots[order[i]])
    } else {
      // Rank performers by angle so `radius` sees their order around the form.
      const angles = current.map(([x, y]) => Math.atan2(y, x))
      const around = range(PERFORMERS).sort((a, b) => angles[a] - angles[b])
      const rank = new Array<number>(PERFORMERS)
      around.forEach((p, k) => (rank[p] = k))
      next = current.map(([x, y], i) => polar(move.radius(rank[i], Math.hypot(x, y)), angles[i] + move.angle))
      turn = move.angle
    }
    segments.push({ from: current, to: next, turn })
    sets.push(next)
    current = next
  }
  return { sets, segments }
}

const BUILT = build()

/** Every set in order, per performer (the last equals the first form, so the loop is seamless). */
export const SETS: readonly DrillSet[] = BUILT.sets

const MOVE = MOVE_COUNTS * COUNT_SECONDS
const HOLD = HOLD_COUNTS * COUNT_SECONDS
const SEGMENT = MOVE + HOLD

export const LOOP_SECONDS = BUILT.segments.length * SEGMENT

/** A gentle ease, so a move flows out of and into its sets instead of snapping. */
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

/** Every performer's spot at `seconds` into the loop. */
export function positionsAt(seconds: number): Spot[] {
  const t = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
  const index = Math.floor(t / SEGMENT)
  const { from, to, turn } = BUILT.segments[index]
  const k = ease(Math.min(1, (t - index * SEGMENT) / MOVE))
  if (!turn) return from.map(([x, y], i) => [x + (to[i][0] - x) * k, y + (to[i][1] - y) * k])
  // Curved: angle and radius change together, so the path is an arc.
  return from.map(([x, y], i) => {
    const a0 = Math.atan2(y, x)
    const r0 = Math.hypot(x, y)
    const r1 = Math.hypot(to[i][0], to[i][1])
    return polar(r0 + (r1 - r0) * k, a0 + turn * k)
  })
}
