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
    description: 'Grade 2 marching band shows written for younger and smaller bands: comfortable ranges, clean percussion books, and closers the stands can sing.',
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
    description: 'Grade 3 to 4 marching band shows written for competitive high school programs, each performed by a real band before it went on sale.',
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
    description: 'Advanced marching band shows written for state finalists and BOA regional programs: grade 4 to 5 winds, full percussion and sound design.',
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
    description: 'Marching band shows written for bands under 40 winds from the first note, with layered arranging and sound design that fills the texture.',
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
    description: 'Indoor winds shows written for the gym: five to six minutes, three movements, heavier sound design and music that lands fast up close.',
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
    description: 'Marching band shows written and performed in 2025 or later, new to most circuits for the 2027 season and ready once licensing clears.',
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
    description: 'Space-themed marching band shows, from a grade 2 show about the Voyager photo of Earth to advanced shows about the aurora and the stars.',
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
    description: 'Western and Americana marching band shows built on Morricone, Copland and the open plain: the gold rush, the railroad and a year in Kansas.',
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
    description: 'Dark and haunting marching band shows for October: haunted houses, vampires, gargoyles and the deep sea, from grade 2 to advanced.',
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
    description: 'Rock and pop marching band shows built on Queen, Metallica, Tears for Fears, the Beatles and Olivia Rodrigo, arranged for competitive bands.',
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
    description: 'Art and colour marching band shows inspired by Kusama, Banksy, the primary colours and a painter sketching a world into being.',
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
    description: 'Classical and opera marching band shows built on Mozart, Beethoven, Rossini and Purcell, with public-domain sources that keep licensing simple.',
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
    description: 'Nature and seasons marching band shows: a phoenix, a caterpillar, a wolf pack, the deep sea and the aurora, from grade 2 to advanced.',
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
    description: 'Story-driven marching band shows with a plot the audience can follow: an ironworker\'s lunch, a newsroom on deadline, a revolution, a marionette.',
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
