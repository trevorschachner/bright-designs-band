import type { Metadata } from "next";
import { generateMetadata, pageSEOConfigs } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { marchingBandSchemas } from "@/lib/seo/structured-data";

// Generate metadata for shows page
export const metadata: Metadata = generateMetadata(pageSEOConfigs.shows);

export default function ShowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Structured data for show design service */}
      <JsonLd data={marchingBandSchemas.showDesignService} />
    </>
  );
}
