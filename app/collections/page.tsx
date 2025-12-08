import Link from "next/link";
import { collections } from "@/lib/collections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/layout/page-hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marching Band Show Collections - Curated Lists | Bright Designs",
  description: "Explore curated collections of marching band shows by style, difficulty, and ensemble size. Find the perfect show for your band's unique needs.",
};

export default function CollectionsIndexPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Show Collections"
        subtitle="Curated lists of marching band shows tailored to your program's needs."
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collections.map((collection) => (
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
      </section>
    </div>
  );
}

