
import PageHero from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mic2, Users, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dorman High School: 5A Excellence at Scale | Bright Designs",
  description: "How Bright Designs helps Dorman High School maintain State Finalist status with large-scale, high-clarity production design.",
};

export default function DormanCaseStudy() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Dorman High School"
        subtitle="Achieving Clarity at Scale in 5A Competition"
      />

      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12 border shadow-xl">
           <Image 
             src="/placeholder.svg" 
             alt="Dorman High School Marching Band"
             fill
             className="object-cover"
           />
        </div>

        <div className="prose prose-lg mx-auto">
          <div className="flex flex-wrap gap-4 mb-8 not-prose">
            <Badge variant="secondary" className="text-sm">Roebuck, SC</Badge>
            <Badge className="text-sm bg-brand-electric text-brand-midnight">Program Coordination</Badge>
            <Badge className="text-sm bg-brand-midnight text-white">Music Design</Badge>
          </div>

          <h2>The Unique Challenge of &quot;Big&quot;</h2>
          <p>
            Dorman High School fields one of the largest ensembles in South Carolina, consistently marching over 200 students. 
            While size is an advantage for volume, it presents significant design hurdles:
          </p>
          <ul>
            <li><strong>Clarity:</strong> It is easy for a 200-piece band to sound &quot;muddy&quot; or chaotic if the scoring is too dense.</li>
            <li><strong>Visual Readability:</strong> Moving that many bodies requires expert drill design to avoid clutter and ensure forms are readable from the press box.</li>
            <li><strong>Pacing:</strong> Managing the energy of a large group so they don&apos;t burn out by the end of the opener.</li>
          </ul>

          <h2>The Solution: Layered Design</h2>
          <p>
            For Dorman, Bright Designs served as <strong>Program Coordinators</strong> and <strong>Music Designers</strong>, implementing a philosophy of &quot;Clarity through Layering.&quot;
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
            <div className="bg-muted p-6 rounded-xl">
              <Layers className="w-8 h-8 text-brand-electric mb-4" />
              <h3 className="text-xl font-bold mb-2">Music Design: Orchestration</h3>
              <p className="text-muted-foreground text-sm">
                We scored the winds to ensure the melody always cuts through. By using &quot;pyramid balance&quot; in the writing itself, 
                we ensure the low brass provides a massive, warm foundation without obscuring the woodwind flourishes.
              </p>
            </div>
            <div className="bg-muted p-6 rounded-xl">
              <Users className="w-8 h-8 text-brand-electric mb-4" />
              <h3 className="text-xl font-bold mb-2">Program Coordination: Visual Scope</h3>
              <p className="text-muted-foreground text-sm">
                Working with the drill writer, we coordinated a visual package that utilized the full field (goal line to goal line). 
                We ensured large-scale forms allowed the sheer mass of the band to be a &quot;wow&quot; factor, while using staging to hide transitions and maintain flow.
              </p>
            </div>
          </div>

          <h3>Balancing Accessibility and Achievement</h3>
          <p>
            With a band this size, ability levels vary wildly. We write &quot;tiered&quot; parts—Lead Trumpet parts that challenge the All-State players, 
            supported by 2nd and 3rd parts that allow freshmen to contribute successfully. This ensures the <em>entire</em> ensemble sounds great, 
            not just the top 10%.
          </p>

          <h2>The Outcome</h2>
          <p>
            Dorman continues to be a perennial <strong>State Finalist</strong> and a dominant force in SCBDA 5A competition. 
            Their productions are renowned for their massive, wall-of-sound impact and visual grandeur.
            Year after year, judges comment on the &quot;professionalism&quot; and &quot;maturity&quot; of the ensemble&apos;s sound—a direct result of 
            design that prioritizes clarity and tone quality.
          </p>
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" asChild>
            <Link href="/contact">Design for Your Large Ensemble</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
