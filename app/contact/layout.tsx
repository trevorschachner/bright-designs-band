import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/features/seo/JsonLd";
import { createServiceSchema } from "@/lib/seo/structured-data";

// Generate metadata for contact page
export const metadata: Metadata = generateMetadata({ title: "Contact Bright Designs - Professional Marching Band Design Services", description: "Contact Bright Designs for custom marching band shows, reliable arrangements with on-time delivery, and design packages for BOA and state competition.", path: '/contact' });

// Create consultation service schema
const consultationSchema = createServiceSchema({
  name: "Marching Band Design Consultation",
  description: "Professional consultation services for marching band show design, arrangement planning, and competitive preparation.",
  serviceType: "Consultation Service"
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Structured data for consultation service */}
      <JsonLd data={consultationSchema} />
    </>
  );
}
