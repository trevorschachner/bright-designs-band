import type { Metadata } from "next";
import { generateMetadata, pageSEOConfigs } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { organizationSchema } from "@/lib/seo/structured-data";

// Generate metadata for about page
export const metadata: Metadata = generateMetadata(pageSEOConfigs.about);

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Enhanced organization structured data */}
      <JsonLd data={organizationSchema} />
    </>
  );
}
