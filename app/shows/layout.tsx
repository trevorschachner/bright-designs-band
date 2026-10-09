import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { marchingBandSchemas } from "@/lib/seo/structured-data";

// Generate metadata for shows page
export const metadata: Metadata = generateMetadata({ title: "Marching Band Shows for Sale – Full Catalog | Bright Designs", description: "Browse complete marching band shows by difficulty, band size and theme. Buy a show as-is, as arrangements, or as the start of a partial custom show.", path: '/shows' });

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
