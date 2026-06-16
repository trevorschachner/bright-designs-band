export type BlogCategory = 'guide' | 'case-study' | 'article'

export interface BlogPost {
  slug: string
  title: string
  description: string
  excerpt: string
  author: string
  datePublished: string
  dateModified?: string
  category: BlogCategory
  tags: string[]
  readingTime: number
  image?: string
  featured?: boolean
  href: string
}

export interface CaseStudy extends BlogPost {
  school: string
  location: string
  badge: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-choose-a-designer',
    title: 'How to Choose a Marching Band Show Designer',
    description:
      'A comprehensive guide for band directors on selecting the right custom show designer — avoid ghosting, missed deadlines, and unplayable parts.',
    excerpt:
      'Choosing a design team is the single most important decision you make for your competitive season. The right partner elevates your students and makes your life easier.',
    author: 'Bright Designs',
    datePublished: '2024-11-01',
    dateModified: '2025-01-15',
    category: 'guide',
    tags: ['band director', 'show design', 'BOA', 'tips', 'reliability'],
    readingTime: 6,
    featured: true,
    href: '/blog/how-to-choose-a-designer',
  },
  {
    slug: 'case-studies',
    title: 'Success Stories: Travelers Rest, Dorman & Alpharetta',
    description:
      'See how our custom designs helped these programs achieve State Medalist and BOA Finalist status through strategic show design.',
    excerpt:
      'Real results from real programs — from 14th place to State Medalist, and from regional to national-caliber competition.',
    author: 'Bright Designs',
    datePublished: '2024-10-01',
    dateModified: '2025-01-15',
    category: 'case-study',
    tags: ['case study', 'success stories', 'BOA', 'state finalist', 'South Carolina', 'Georgia'],
    readingTime: 4,
    href: '/blog/case-studies',
  },
]

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'travelers-rest',
    school: 'Travelers Rest High School',
    location: 'Travelers Rest, SC',
    badge: 'State Medalist',
    title: 'Travelers Rest High School: From 14th Place to State Medalist',
    description:
      'How strategic show design helped Travelers Rest High School become a consistent State Medalist and BOA Regional Finalist.',
    excerpt:
      'Competing in South Carolina\'s fierce AAA classification, the band was stuck around 14th place at Upper State — just missing finals. We built them a ladder.',
    author: 'Bright Designs',
    datePublished: '2024-10-01',
    dateModified: '2025-01-15',
    category: 'case-study',
    tags: ['case study', 'Travelers Rest', 'South Carolina', 'state medalist', 'BOA regional'],
    readingTime: 5,
    href: '/blog/case-studies/travelers-rest',
  },
  {
    slug: 'dorman',
    school: 'Dorman High School',
    location: 'Roebuck, SC',
    badge: '5A State Finalist',
    title: 'Dorman High School: 5A Excellence at Scale',
    description:
      'How Bright Designs helps Dorman High School maintain State Finalist status with large-scale, high-clarity production design.',
    excerpt:
      'Dorman fields one of the largest ensembles in South Carolina. While size is an advantage for volume, it presents significant design hurdles.',
    author: 'Bright Designs',
    datePublished: '2024-10-05',
    dateModified: '2025-01-15',
    category: 'case-study',
    tags: ['case study', 'Dorman', 'South Carolina', 'SCBDA 5A', 'state finalist'],
    readingTime: 5,
    href: '/blog/case-studies/dorman',
  },
  {
    slug: 'alpharetta',
    school: 'Alpharetta High School',
    location: 'Alpharetta, GA',
    badge: 'BOA Finalist',
    title: 'Alpharetta High School: Sophistication in Design',
    description:
      'Custom wind and percussion arrangements tailored for Alpharetta High School\'s specific section strengths and BOA competition.',
    excerpt:
      'Alpharetta competes in the Atlanta metro — one of the most competitive marching band regions in the country. Clean isn\'t enough. You need to be artistically sophisticated.',
    author: 'Bright Designs',
    datePublished: '2024-10-10',
    dateModified: '2025-01-15',
    category: 'case-study',
    tags: ['case study', 'Alpharetta', 'Georgia', 'BOA', 'BOA finalist', 'Atlanta'],
    readingTime: 5,
    href: '/blog/case-studies/alpharetta',
  },
]

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  guide: 'Guide',
  'case-study': 'Case Study',
  article: 'Article',
}

export const CATEGORY_COLORS: Record<BlogCategory, string> = {
  guide: 'bg-brand-electric text-brand-midnight',
  'case-study': 'bg-brand-midnight text-white',
  article: 'bg-muted text-foreground',
}
