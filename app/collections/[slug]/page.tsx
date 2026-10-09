import { notFound } from "next/navigation";
import { getCollectionBySlug, publishedCollections, MIN_COLLECTION_SHOWS } from "@/lib/collections";
import { getShowsByFilter, getCollectionCounts } from "@/lib/services/shows";
import { getCollectionContent } from "@/lib/content/collections";
import { parseProgramNotes, type ProgramNotes as ParsedNotes } from "@/lib/content/program-notes";
import { ProgramNotes } from "@/components/features/program-notes";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { createBreadcrumbSchema, createFAQSchema, createCollectionPageSchema } from "@/lib/seo/structured-data";
import { ShowCard } from "@/components/features/shows/ShowCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await publishedCollections()).map((collection) => ({ slug: collection.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return buildMetadata({ title: "Collection not found", description: "This collection does not exist.", noindex: true });
  }

  return buildMetadata({
    title: collection.title,
    description: collection.description,
    keywords: collection.keywords,
    path: `/collections/${slug}`,
  });
}

/** The intro minus its first paragraph (which is the hero lede). */
function restOfIntro(notes: ParsedNotes): ParsedNotes {
  const sections = notes.sections
    .map((section, i) => (i === 0 ? { ...section, blocks: section.blocks.slice(1) } : section))
    .filter((section) => section.heading !== null || section.blocks.length > 0);
  return { ...notes, sections };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const counts = await getCollectionCounts();
  if ((counts[slug] ?? 0) < MIN_COLLECTION_SHOWS) {
    notFound();
  }

  const shows = await getShowsByFilter(collection.filter);
  const { intro, faq } = getCollectionContent(slug);
  const notes = parseProgramNotes(intro);
  const firstBlock = notes.sections[0]?.blocks[0];
  const lede = firstBlock && firstBlock.kind === "p" ? firstBlock.text : collection.description;
  const rest = restOfIntro(notes);
  const published = await publishedCollections();
  const related = collection.relatedCollections
    .map((s) => published.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const schemas = [
    createBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Shows", url: "/shows" },
      { name: "Collections", url: "/collections" },
      { name: collection.h1, url: `/collections/${slug}` },
    ]),
    createCollectionPageSchema({
      name: collection.h1,
      description: collection.description,
      url: `/collections/${slug}`,
      items: shows.map((s) => ({ name: s.title, url: `/shows/${s.slug}` })),
    }),
    ...(faq.length > 0 ? [createFAQSchema(faq)] : []),
  ];

  return (
    <div className="min-h-screen">
      <JsonLd data={schemas} />
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
              {lede}
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
            Every show here is for sale as-is, as arrangements for a build-your-own show, or as the start of a partial custom show. Pricing is quoted per program.
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

      {rest.sections.length > 0 && (
        <section className="py-12 border-t border-border bg-muted/10">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-heading font-bold mb-4">About these shows</h2>
            <ProgramNotes notes={rest} />
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-heading font-bold mb-6">Questions directors ask</h2>
            {faq.map((item) => (
              <div key={item.question} className="mb-6">
                <h3 className="text-lg font-heading font-semibold mb-2">{item.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(related.length > 0 || collection.relatedArticles.length > 0) && (
        <section className="py-12 border-t border-border bg-muted/10">
          <div className="container mx-auto px-4 max-w-3xl">
            {related.length > 0 && (
              <>
                <h2 className="text-2xl font-heading font-bold mb-4">Related collections</h2>
                <ul className="list-disc pl-6 mb-8 space-y-1">
                  {related.map((c) => (
                    <li key={c.slug}>
                      <Link className="underline" href={`/collections/${c.slug}`}>{c.h1}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {collection.relatedArticles.length > 0 && (
              <>
                <h2 className="text-2xl font-heading font-bold mb-4">Read next</h2>
                <ul className="list-disc pl-6 space-y-1">
                  {collection.relatedArticles.map((a) => (
                    <li key={a.href}>
                      <Link className="underline" href={a.href}>{a.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

