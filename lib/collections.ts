
export interface CollectionConfig {
  slug: string;
  title: string;
  description: string;
  h1: string; // Specific H1 for the page
  keywords: string[];
  filter: {
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    tag?: string;
    featured?: boolean;
  };
}

export const collections: CollectionConfig[] = [
  {
    slug: 'competitive-marching-band-shows',
    title: 'Competitive Marching Band Shows - BOA & State Finalist Design',
    description: 'Browse our catalog of competitive marching band shows designed for BOA and state championship success. High-level design for ambitious programs.',
    h1: 'Competitive Marching Band Shows',
    keywords: ['competitive marching band shows', 'BOA marching band shows', 'state finalist marching band shows', 'contest shows'],
    filter: {
      difficulty: 'Advanced'
    }
  },
  {
    slug: 'small-band-marching-shows',
    title: 'Small Band Marching Shows - Big Sound for Small Ensembles',
    description: 'Custom marching band shows crafted specifically for small bands. Clever arranging and visual design to maximize your ensemble\'s presence.',
    h1: 'Small Band Marching Shows',
    keywords: ['small band marching shows', 'marching band shows for small bands', 'small ensemble marching shows'],
    filter: {
      tag: 'Small Band'
    }
  },
  {
    slug: 'easy-marching-band-shows',
    title: 'Easy Marching Band Shows - Accessible & Educational',
    description: 'Accessible marching band shows for developing programs. Focus on fundamental success and educational growth without sacrificing effect.',
    h1: 'Accessible Marching Band Shows',
    keywords: ['easy marching band shows', 'grade 2 marching band shows', 'beginner marching band shows'],
    filter: {
      difficulty: 'Beginner'
    }
  },
  {
    slug: 'grade-3-marching-band-shows',
    title: 'Grade 3 Marching Band Shows - Intermediate Competition',
    description: 'Intermediate marching band shows (Grade 3-4) balancing challenge and achievability. Perfect for growing competitive programs.',
    h1: 'Grade 3 Marching Band Shows',
    keywords: ['grade 3 marching band shows', 'intermediate marching band shows', 'grade 4 marching band shows'],
    filter: {
      difficulty: 'Intermediate'
    }
  }
];

export function getCollectionBySlug(slug: string): CollectionConfig | undefined {
  return collections.find(c => c.slug === slug);
}

