/**
 * The 2027 Indoor Winds Free Show: one winds group, drawn at random, gets a
 * custom 2027 show (wind music and drill) free. Sign-ups post to /api/contact with this type;
 * the route folds the program questions into the stored message so admin,
 * the staff email and Attio all show them without schema changes.
 */

export const FREE_SHOW_TYPE = 'free_show_signup'
export const FREE_SHOW_SOURCE = 'indoor-winds-2027'
export const FREE_SHOW_TITLE = '2027 Indoor Winds Free Show'
// What entrants see. FREE_SHOW_TITLE stays as the internal label in the
// database, Attio and staff email so earlier entries still group with new ones.
export const FREE_SHOW_PUBLIC_NAME = '2027 Indoor Winds Giveaway'
export const FREE_SHOW_PATH = '/indoor-winds-2027'

// Entries close at the end of November 30, 2026, Eastern time. The route
// rejects entries after this; the page swaps the form for a closed notice.
export const FREE_SHOW_DEADLINE = new Date('2026-12-01T05:00:00Z')
export const FREE_SHOW_DEADLINE_LABEL = 'November 30'

export const freeShowOpen = (now: Date = new Date()) => now < FREE_SHOW_DEADLINE

export type FreeShowAnswers = {
  location?: string
  programBenefit?: string
  recentChallenges?: string
  usedDesignGroup?: 'yes' | 'no'
  previousDesignGroup?: string
  message?: string
}

/** The sign-up answers as one labelled plain-text block. */
export function freeShowMessage(answers: FreeShowAnswers): string {
  const designGroup =
    answers.usedDesignGroup === 'yes'
      ? `Yes${answers.previousDesignGroup ? ` (${answers.previousDesignGroup})` : ''}`
      : answers.usedDesignGroup === 'no'
        ? 'No'
        : ''

  const sections: Array<[string, string | undefined]> = [
    ['Location', answers.location],
    ['How would this help your group?', answers.programBenefit],
    ['Challenges in the past 12 months', answers.recentChallenges],
    ['Used a design group before?', designGroup],
    ['Anything else', answers.message],
  ]

  return sections
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}:\n${value}`)
    .join('\n\n')
}
