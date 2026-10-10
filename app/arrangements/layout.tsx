import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { marchingBandSchemas } from "@/lib/seo/structured-data";

// Generate metadata for arrangements page
export const metadata: Metadata = generateMetadata({ title: "Marching Band Arrangements of Popular Songs and Classics | Bright Designs", description: "Marching band arrangements of pop, rock, film and classical pieces, each with audio. Use one in your show or combine several into a build-your-own program.", path: '/arrangements' });

export default function ArrangementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Structured data for arrangements service */}
      <JsonLd data={marchingBandSchemas.arrangementService} />
    </>
  );
}
