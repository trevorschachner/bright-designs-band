import { getCollectionCounts, type ShowDifficulty } from '@/lib/services/shows'

export type CollectionGroup = 'level' | 'size' | 'theme' | 'season'

export interface CollectionConfig {
  slug: string
  title: string // <title>
  h1: string
  description: string // meta description, 100-160 chars
  group: CollectionGroup
  keywords: string[]
  filter: { difficulty?: ShowDifficulty; tags?: string[]; yearMin?: number }
  relatedCollections: string[] // slugs
  relatedArticles: { title: string; href: string }[]
}

/** A collection page is published only when at least this many shows match. */
export const MIN_COLLECTION_SHOWS = 2

const DESIGNER_ARTICLE = { title: 'How to Choose a Marching Band Show Designer', href: '/blog/how-to-choose-a-designer' }

export const collections: CollectionConfig[] = [
  {
    slug: 'easy-marching-band-shows',
    title: 'Easy Marching Band Shows (Grade 2) | Bright Designs',
    h1: 'Easy Marching Band Shows (Grade 2)',
    description: 'Easy marching band shows are the ones we wrote for younger or smaller bands: grade 2 winds, percussion books that a first-year battery can clean, and',
    group: 'level',
    keywords: ['easy marching band shows', 'grade 2 marching band shows', 'beginner marching band shows', 'marching band shows for young bands'],
    filter: { difficulty: 'Beginner' },
    relatedCollections: ['grade-3-marching-band-shows', 'competitive-marching-band-shows', 'small-band-marching-band-shows', 'new-marching-band-shows-2027'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'grade-3-marching-band-shows',
    title: 'Grade 3 Marching Band Shows | Bright Designs',
    h1: 'Grade 3 Marching Band Shows',
    description: 'Grade 3 is where most competitive high school bands live, and it is where most of our catalog lives: nineteen shows written at grade 3 to 4 for',
    group: 'level',
    keywords: ['grade 3 marching band shows', 'intermediate marching band shows', 'grade 4 marching band shows', 'marching band shows for sale'],
    filter: { difficulty: 'Intermediate' },
    relatedCollections: ['easy-marching-band-shows', 'competitive-marching-band-shows', 'small-band-marching-band-shows', 'new-marching-band-shows-2027'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'competitive-marching-band-shows',
    title: 'Competitive Marching Band Shows (Grade 4–5) | Bright Designs',
    h1: 'Competitive Marching Band Shows (Grade 4–5)',
    description: 'These are the shows we wrote for bands chasing state finals and Bands of America regional placements: grade 4 to 5 winds, full percussion and sound',
    group: 'level',
    keywords: ['competitive marching band shows', 'BOA marching band shows', 'state finalist marching band shows', 'grade 5 marching band shows'],
    filter: { difficulty: 'Advanced' },
    relatedCollections: ['easy-marching-band-shows', 'grade-3-marching-band-shows', 'small-band-marching-band-shows', 'new-marching-band-shows-2027'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'small-band-marching-band-shows',
    title: 'Marching Band Shows for Small Bands | Bright Designs',
    h1: 'Marching Band Shows for Small Bands',
    description: 'Small bands get the worst deal in show design: most catalogs are written for 80 winds and then thinned out. The shows on this page were written for',
    group: 'size',
    keywords: ['marching band shows for small bands', 'small school marching band shows', 'small band marching shows'],
    filter: { tags: ['Small Band'] },
    relatedCollections: ['easy-marching-band-shows', 'grade-3-marching-band-shows', 'competitive-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'indoor-winds-shows',
    title: 'Indoor Winds Shows | Bright Designs',
    h1: 'Indoor Winds Shows',
    description: 'Indoor winds is a different show: five to six minutes, a gym instead of a stadium, a floor instead of a field, and an audience close enough to see',
    group: 'size',
    keywords: ['indoor winds shows', 'winter winds show', 'indoor winds marching band show', 'winds show for sale'],
    filter: { tags: ['Indoor Winds'] },
    relatedCollections: ['easy-marching-band-shows', 'grade-3-marching-band-shows', 'competitive-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'new-marching-band-shows-2027',
    title: 'New Marching Band Shows for 2027 | Bright Designs',
    h1: 'New Marching Band Shows for 2027',
    description: 'Every show on this page was written and performed in 2025 or later, which means it is new to the circuit for the 2027 season. Nineteen shows qualify.',
    group: 'season',
    keywords: ['new marching band shows 2027', '2027 marching band show', 'new marching band shows', 'marching band shows for 2027 season'],
    filter: { yearMin: 2025 },
    relatedCollections: ['easy-marching-band-shows', 'grade-3-marching-band-shows', 'competitive-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'space-marching-band-shows',
    title: 'Space and Sky Marching Band Shows | Bright Designs',
    h1: 'Space and Sky Marching Band Shows',
    description: 'Space shows work because the music already exists: Holst, Zimmer, the Voyager story, the aurora. The three shows here each take a different angle on',
    group: 'theme',
    keywords: ['space marching band show', 'space themed marching band shows', 'marching band show themes'],
    filter: { tags: ['Theme: Space'] },
    relatedCollections: ['western-marching-band-shows', 'dark-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'western-marching-band-shows',
    title: 'Western and Americana Marching Band Shows | Bright Designs',
    h1: 'Western and Americana Marching Band Shows',
    description: 'Western shows give a band a story the whole stadium already knows: the gold rush, the railroad, the open plain. The three shows here were written for',
    group: 'theme',
    keywords: ['western marching band show', 'americana marching band shows', 'western themed marching band shows'],
    filter: { tags: ['Theme: Western'] },
    relatedCollections: ['dark-marching-band-shows', 'rock-and-pop-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'dark-marching-band-shows',
    title: 'Dark and Haunting Marching Band Shows | Bright Designs',
    h1: 'Dark and Haunting Marching Band Shows',
    description: 'Dark shows are the ones directors ask about in October: haunted houses, vampires, gargoyles, the deep sea. Seven shows in the catalog carry this',
    group: 'theme',
    keywords: ['dark marching band show', 'haunted marching band show', 'spooky marching band shows'],
    filter: { tags: ['Theme: Dark'] },
    relatedCollections: ['rock-and-pop-marching-band-shows', 'art-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'rock-and-pop-marching-band-shows',
    title: 'Rock and Pop Marching Band Shows | Bright Designs',
    h1: 'Rock and Pop Marching Band Shows',
    description: 'Rock and pop shows are the ones the stands sing along to. Six shows in the catalog are built on songs by Queen, Metallica, Tears for Fears, the',
    group: 'theme',
    keywords: ['rock marching band show', 'pop marching band show', 'Queen marching band show', 'rock and pop marching band shows'],
    filter: { tags: ['Theme: Rock & Pop'] },
    relatedCollections: ['art-marching-band-shows', 'classical-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'art-marching-band-shows',
    title: 'Art and Color Marching Band Shows | Bright Designs',
    h1: 'Art and Color Marching Band Shows',
    description: 'Art shows give a band a visual identity before the first note: a colour, a dot, a sketch, a stencil on a wall. The four shows here take their themes',
    group: 'theme',
    keywords: ['art themed marching band show', 'color marching band show', 'art marching band shows'],
    filter: { tags: ['Theme: Art'] },
    relatedCollections: ['classical-marching-band-shows', 'nature-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'classical-marching-band-shows',
    title: 'Classical and Opera Marching Band Shows | Bright Designs',
    h1: 'Classical and Opera Marching Band Shows',
    description: 'Classical and opera shows give a band music that is out of copyright, plays well in the open air and has already survived two centuries of audiences.',
    group: 'theme',
    keywords: ['classical marching band show', 'opera marching band show', 'classical marching band shows'],
    filter: { tags: ['Theme: Classical'] },
    relatedCollections: ['nature-marching-band-shows', 'story-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'nature-marching-band-shows',
    title: 'Nature and Seasons Marching Band Shows | Bright Designs',
    h1: 'Nature and Seasons Marching Band Shows',
    description: 'Nature shows run from a caterpillar becoming a butterfly to a wolf pack hunting under the moon. Eight shows in the catalog take their themes from',
    group: 'theme',
    keywords: ['nature marching band show', 'animal marching band show', 'seasons marching band show'],
    filter: { tags: ['Theme: Nature'] },
    relatedCollections: ['story-marching-band-shows', 'space-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
  {
    slug: 'story-marching-band-shows',
    title: 'Story-Driven and Theatrical Marching Band Shows',
    h1: 'Story-Driven and Theatrical Marching Band Shows',
    description: 'Story shows have a plot: a worker eating lunch on a steel beam, a newsroom on deadline, a revolution, a marionette cutting its strings. Eighteen',
    group: 'theme',
    keywords: ['story marching band show', 'theatrical marching band show', 'narrative marching band shows'],
    filter: { tags: ['Theme: Story'] },
    relatedCollections: ['space-marching-band-shows', 'western-marching-band-shows', 'grade-3-marching-band-shows'],
    relatedArticles: [DESIGNER_ARTICLE],
  },
]

export function getCollectionBySlug(slug: string): CollectionConfig | undefined {
  return collections.find((c) => c.slug === slug)
}

type ShowFacts = { difficulty: string | null; year: number | null; tagNames: string[] }

export function matchesFilter(show: ShowFacts, filter: CollectionConfig['filter']): boolean {
  if (filter.difficulty && show.difficulty !== filter.difficulty) return false
  if (filter.yearMin && !(show.year && show.year >= filter.yearMin)) return false
  if (filter.tags && !filter.tags.every((t) => show.tagNames.includes(t))) return false
  return true
}

export function collectionsForShow(show: ShowFacts): CollectionConfig[] {
  return collections.filter((c) => matchesFilter(show, c.filter))
}

/** Collections with enough shows to be a real landing page. The only publish rule. */
export async function publishedCollections(): Promise<CollectionConfig[]> {
  const counts = await getCollectionCounts()
  return collections.filter((c) => (counts[c.slug] ?? 0) >= MIN_COLLECTION_SHOWS)
}
