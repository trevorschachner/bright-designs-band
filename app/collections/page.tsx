import Link from "next/link";
import { publishedCollections, type CollectionGroup } from "@/lib/collections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/layout/page-hero";
import { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Marching Band Show Collections - Curated Lists | Bright Designs",
  description: "Explore curated collections of marching band shows by style, difficulty, and ensemble size. Find the perfect show for your band's unique needs.",
  path: "/collections",
});

const GROUPS: { group: CollectionGroup; heading: string }[] = [
  { group: "level", heading: "By difficulty" },
  { group: "size", heading: "By band size" },
  { group: "theme", heading: "By theme" },
  { group: "season", heading: "By season" },
];

export default async function CollectionsIndexPage() {
  const published = await publishedCollections();

  return (
    <div className="min-h-screen">
      <PageHero
        title="Show Collections"
        subtitle="Curated lists of marching band shows tailored to your program's needs."
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <p className="max-w-3xl text-lg text-muted-foreground leading-relaxed mb-12">
            Collections are the quickest way into the catalog. Every show here is a complete marching band production we wrote for a real program, and every one is for sale as-is, as separate arrangements, or as the start of a partial custom show. Start with your band&apos;s grade level or size, or browse by theme if you already know the story you want to tell. Pricing is quoted per program; tell us which show you are looking at and we will send a quote within a day.
          </p>
          {GROUPS.map(({ group, heading }) => {
            const items = published.filter((c) => c.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-12">
                <h2 className="text-2xl font-heading font-bold mb-6">{heading}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((collection) => (
                    <Link key={collection.slug} href={`/collections/${collection.slug}`} className="block group">
                      <Card className="h-full hover:shadow-lg transition-all duration-300 border-t-4 border-t-brand-electric group-hover:-translate-y-1">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            <span className="group-hover:text-brand-electric transition-colors">
                              {collection.h1}
                            </span>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-electric group-hover:translate-x-1 transition-all" />
                          </CardTitle>
                          <CardDescription className="text-base mt-2">
                            {collection.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {collection.keywords.slice(0, 3).map((keyword) => (
                              <span key={keyword} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
