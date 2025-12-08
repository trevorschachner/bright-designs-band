import { notFound } from "next/navigation";
import { getCollectionBySlug, collections } from "@/lib/collections";
import { getShowsByFilter } from "@/lib/services/shows";
import { ShowCard } from "@/components/features/shows/ShowCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Metadata } from "next";

export async function generateStaticParams() {
  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  return {
    title: collection.title,
    description: collection.description,
    keywords: collection.keywords,
    openGraph: {
      title: collection.title,
      description: collection.description,
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const shows = await getShowsByFilter(collection.filter);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/shows" className="hover:text-primary transition-colors">
                Shows
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Collections</span>
            </div>
            
            {/* Specific H1 for SEO */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6 text-brand-midnight">
              {collection.h1}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {collection.description}
            </p>

            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Start Your Design
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/shows">
                  Browse Full Catalog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Customization Banner */}
      <div className="bg-brand-midnight text-white py-4 border-y border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-base sm:text-lg font-medium">
            <span className="text-brand-electric mr-2">✨ Perfect Fit Guarantee:</span> 
            We can re-arrange any show to fit your band&apos;s specific skill level for <span className="font-bold underline decoration-brand-electric underline-offset-4">no extra cost</span>.
          </p>
        </div>
      </div>

      {/* Show List */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          {shows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shows.map((show) => (
                <ShowCard key={show.id} item={show} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
              <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                We are currently curating shows for this specific collection. 
                Browse our full catalog to see all available designs.
              </p>
              <Button asChild>
                <Link href="/shows">View All Shows</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* SEO Footer Text (optional, good for keyword density) */}
      <section className="py-12 border-t border-border bg-muted/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4">Why Choose Our {collection.h1}?</h2>
          <p className="text-muted-foreground">
            Bright Designs specializes in creating {collection.keywords[0]} that help your program succeed. 
            Whether you need competitive impact or educational value, our custom designs deliver results.
          </p>
        </div>
      </section>
    </div>
  );
}

