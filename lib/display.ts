/**
 * How catalog values read on a page. Pure and client-safe. Every public page,
 * card and player formats through here so the same value never reads two
 * ways (the arrangement OG card used to say "1 2" where the page said
 * "Grade 1-2").
 */

/** `m:ss`, seconds floored. */
export function clock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** A part's stored length: `m:ss`, or an em dash when unknown (missing or 0). */
export function durationLabel(seconds: number | null | undefined): string {
  return seconds && seconds > 0 ? clock(seconds) : '—'
}

/** A media element's position or length: `m:ss`, `0:00` before metadata loads. */
export function playerTime(seconds: number): string {
  return Number.isFinite(seconds) ? clock(Math.max(0, seconds)) : '0:00'
}

const GRADE_LABELS: Record<string, string> = { '1_2': 'Grade 1-2', '3_4': 'Grade 3-4', '5_plus': 'Grade 5+' }

/** `grade_band` → "Grade 1-2" / "Grade 3-4" / "Grade 5+"; null when unset. */
export function gradeLabel(grade: string | null | undefined): string | null {
  return grade ? GRADE_LABELS[grade] ?? null : null
}

const ENSEMBLE_LABELS: Record<string, string> = {
  small: 'Small Ensemble',
  medium: 'Medium Ensemble',
  large: 'Large Ensemble',
}

/** `ensemble_size` → "Small Ensemble" etc.; null when unset. */
export function ensembleLabel(size: string | null | undefined): string | null {
  return size ? ENSEMBLE_LABELS[size] ?? null : null
}

/** A show's difficulty (already Beginner/Intermediate/Advanced in the DB) for a card. */
export function difficultyLabel(difficulty: string | null | undefined): string {
  return difficulty || 'Not specified'
}
