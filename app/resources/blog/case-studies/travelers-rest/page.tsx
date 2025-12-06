
import PageHero from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Trophy, ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Travelers Rest High School: From 14th Place to State Medalist | Bright Designs",
  description: "Read the case study on how strategic show design helped Travelers Rest High School become a consistent State Medalist and BOA Regional Finalist.",
};

export default function TravelersRestCaseStudy() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Travelers Rest High School"
        subtitle="The Journey from Out of Finals to State Medalist"
      />

      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12 border shadow-xl">
           <Image 
             src="/placeholder.svg" 
             alt="Travelers Rest High School Marching Band"
             fill
             className="object-cover"
           />
        </div>

        <div className="prose prose-lg mx-auto">
          <div className="flex flex-wrap gap-4 mb-8 not-prose">
            <Badge variant="secondary" className="text-sm">Travelers Rest, SC</Badge>
            <Badge className="text-sm bg-brand-electric text-brand-midnight hover:bg-brand-electric/90">Program Coordination</Badge>
            <Badge className="text-sm bg-brand-midnight text-white hover:bg-brand-midnight/90">Music Design</Badge>
          </div>

          <h2>The Context</h2>
          <p>
            Travelers Rest High School (TR) had a passionate student base and dedicated staff, but they were stuck in a competitive plateau. 
            Competing in South Carolina's fierce AAA and AAAA classifications, the band was consistently finishing around 14th place at Upper State—just missing the cutoff for State Finals.
          </p>
          <p>
            The students were working hard, but the vehicle on the field wasn't rewarding their efforts. The show designs were often "too safe" to be competitive or "too difficult" to be clean.
          </p>

          <div className="my-12 p-8 bg-muted rounded-xl border-l-4 border-brand-electric not-prose">
            <Quote className="w-8 h-8 text-brand-electric mb-4 opacity-50" />
            <p className="text-xl font-medium italic text-muted-foreground mb-4">
              "We needed a change. We needed a design team that understood where we were and, more importantly, where we wanted to go. Bright Designs didn't just write us a show; they built us a ladder."
            </p>
            <div className="font-bold text-brand-midnight">– Ryan Wilhite, Former Director of Bands</div>
          </div>

          <h2>The Strategy: "Maximize GE"</h2>
          <p>
            To jump from 14th place to the Top 3, we couldn't just be "better." We had to be <strong>smarter</strong>. 
            As <strong>Program Coordinators</strong> and <strong>Music Designers</strong>, Bright Designs partnered with TR's staff to implement a comprehensive strategy.
          </p>

          <h3>1. Program Coordination: The Vision</h3>
          <p>
            We worked to align every element of the production—music, visual, and props—under a single, cohesive vision.
            With a mid-sized ensemble, "looking small" is a death sentence on the score sheets. We coordinated with the visual team to ensure:
          </p>
          <ul>
            <li><strong>Strategic Staging:</strong> Compressed staging to create visual density and integrate the winds and guard.</li>
            <li><strong>Prop Integration:</strong> Using scenic elements to frame the field, focusing the audience's eye and making the band appear larger.</li>
          </ul>

          <h3>2. Music Design: "Goldilocks" Difficulty</h3>
          <p>
            Previous shows often exposed student weaknesses. We pivoted to writing <strong>achievable vocabulary</strong>. 
            The wind book was designed to sound sophisticated and full, but lay comfortably in the students' ranges. 
            This allowed the students to play with confidence, volume, and great intonation—factors that immediately boosted Music Analysis scores.
          </p>

          <h3>3. Cohesive Conceptual Design</h3>
          <p>
            We moved away from abstract themes to clear, emotionally resonant concepts. Whether it was a darker, intense show or a lighthearted production, 
            every musical and visual moment served a single, unified idea that judges could instantly grasp and reward.
          </p>

          <h2>The Outcome</h2>
          <p>
            The results were historic for the program. In the first year of our partnership, Travelers Rest didn't just make finals—they skyrocketed up the rankings.
          </p>
          <ul>
            <li><strong>State Finals:</strong> TR became a consistent State Medalist (Top 3), earning multiple caption awards for Visual Performance and General Effect.</li>
            <li><strong>Regional Success:</strong> The success translated to the national stage, with the band becoming a frequent <strong>BOA Regional Finalist</strong>, competing against some of the best programs in the Southeast.</li>
          </ul>
          <p>
            Most importantly, the culture of the program shifted. The students now <em>expect</em> excellence because they know their show gives them the opportunity to achieve it.
          </p>
        </div>

        <div className="mt-16 p-8 bg-brand-midnight text-white rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-6 font-heading text-center">By The Numbers</h3>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-brand-electric mb-2">14th</div>
              <div className="text-sm text-gray-300 uppercase tracking-wider">Previous Ranking</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-brand-electric mb-2">Top 3</div>
              <div className="text-sm text-gray-300 uppercase tracking-wider">Consistent Medalist</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-brand-electric mb-2">10+</div>
              <div className="text-sm text-gray-300 uppercase tracking-wider">Caption Awards</div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to write your own turnaround story?</h3>
          <Button size="lg" className="bg-brand-electric text-brand-midnight hover:bg-white transition-colors" asChild>
            <Link href="/contact">Let's Talk Design</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
