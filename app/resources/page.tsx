import { Metadata } from "next"
import PageHero from "@/components/layout/page-hero"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { GuideDownloadDialog } from "@/components/features/resources/GuideDownloadDialog"
import { FileText, Download, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Resources | Bright Designs Band",
  description: "Free resources, guides, and tools for marching band directors and educators.",
}

// Use revalidation instead of force-dynamic for better performance
export const revalidate = 60; // Revalidate every minute
// export const dynamic = 'force-dynamic';

async function getResources() {
  try {
    const { db } = await import('@/lib/database');
    const { resources } = await import('@/lib/database/schema');
    const { desc, eq } = await import('drizzle-orm');
    
    const data = await db.select().from(resources).where(eq(resources.isActive, true)).orderBy(desc(resources.createdAt));
    return data;
  } catch (e) {
    console.error('Failed to fetch resources:', e);
    return [];
  }
}

export default async function ResourcesPage() {
  const resourcesList = await getResources();

  // Hardcoded blog posts for now
  const blogPosts = [
    {
      slug: 'how-to-choose-a-designer',
      title: 'How to Choose a Marching Band Show Designer',
      description: 'The 2025 Guide for Band Directors. Avoid ghosting, missed deadlines, and unplayable parts.',
      image: '/placeholder.svg',
      link: '/resources/blog/how-to-choose-a-designer'
    },
    {
      slug: 'case-studies',
      title: 'Success Stories: Travelers Rest, Dorman, & Alpharetta',
      description: 'See how our custom designs helped these programs achieve State Medalist and BOA Finalist status.',
      image: '/placeholder.svg',
      link: '/resources/blog/case-studies'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        title="Resources"
        subtitle="Free guides and tools to help your program succeed."
      />

      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Blog / Articles Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 font-heading">Articles & Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={post.link} className="block h-full group">
                  <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-t-4 border-t-brand-electric group-hover:-translate-y-1">
                    <div className="h-48 bg-muted flex items-center justify-center border-b overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-brand-electric transition-colors">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                    </CardContent>
                    <CardFooter>
                      <div className="text-brand-electric font-medium flex items-center text-sm">
                        Read Article <BookOpen className="ml-2 h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Downloads / Tools Section */}
          <div>
            <h2 className="text-2xl font-bold mb-8 font-heading">Downloads & Tools</h2>
            {resourcesList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resourcesList.map((resource: any) => (
                  <Card key={resource.id} className="flex flex-col h-full">
                    <div className="h-48 bg-muted flex items-center justify-center border-b overflow-hidden relative">
                      {resource.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center opacity-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src="/placeholder-logo.png" 
                            alt="Bright Designs" 
                            className="h-24 w-24 object-contain grayscale"
                          />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {resource.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {/* Spacer/Content */}
                    </CardContent>
                    <CardFooter>
                      {resource.requiresContactForm ? (
                        <GuideDownloadDialog 
                          resourceId={resource.id}
                          resourceTitle={resource.title}
                          fileUrl={resource.fileUrl || '#'}
                        />
                      ) : (
                        <Button className="w-full" asChild>
                          <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-xl bg-muted/20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No downloads available yet</h3>
                <p className="text-muted-foreground mt-2">Check back soon for new guides and tools.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
