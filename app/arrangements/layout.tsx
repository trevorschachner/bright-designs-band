import type { Metadata } from "next";
import { generateMetadata, pageSEOConfigs } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { marchingBandSchemas } from "@/lib/seo/structured-data";

// Generate metadata for arrangements page
export const metadata: Metadata = generateMetadata(pageSEOConfigs.arrangements);

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
