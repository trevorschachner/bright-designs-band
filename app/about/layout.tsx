import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";

// Generate metadata for about page
export const metadata: Metadata = generateMetadata({ title: "Marching Band Show Designers in South Carolina | Bright Designs", description: "Trevor Schachner, Brighton Barrineau and Ryan Wilhite: three designers writing custom and pre-written marching band shows for programs across the Southeast.", path: '/about' });

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
