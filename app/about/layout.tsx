import type { Metadata } from "next";
import { generateMetadata, pageSEOConfigs } from "@/lib/seo/metadata";

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
    </>
  );
}
