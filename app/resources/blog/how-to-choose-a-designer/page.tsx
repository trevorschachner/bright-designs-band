
import PageHero from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, AlertTriangle, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How to Choose a Marching Band Show Designer | Bright Designs",
  description: "A comprehensive guide for band directors on selecting the right custom show designer. Compare reliability, customization, and cost.",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="How to Choose a Show Designer"
        subtitle="The 2025 Guide for Band Directors. Avoid ghosting, missed deadlines, and unplayable parts."
      />

      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="prose prose-lg mx-auto mb-16">
          <p className="lead text-xl text-muted-foreground">
            Choosing a design team is the single most important decision you make for your competitive season. 
            The right partner elevates your students and makes your life easier; the wrong one causes months of stress, wasted rehearsals, and lower scores.
          </p>

          <p>
            With hundreds of "custom design" sites popping up, how do you filter the professionals from the hobbyists? 
            Here is the honest truth about what to look for—and what to avoid.
          </p>

          <div className="my-12 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <h3 className="text-amber-800 flex items-center gap-2 mt-0">
              <AlertTriangle className="w-5 h-5" />
              The "Ghosting" Epidemic
            </h3>
            <p className="text-amber-900 mb-0">
              The #1 complaint we hear from new clients isn't about bad music—it's about communication. 
              Too many designers take a deposit and then disappear until August. Your designer needs to be a <strong>partner</strong>, 
              not just a vendor.
            </p>
          </div>

          <h3>1. Reliability is a Skill</h3>
          <p>
            Does your designer reply to emails within 24 hours? Do they have a published production calendar? 
            At Bright Designs, we treat show design like project management. We use a structured system 
            to ensure you never have to chase us for a movement or a rewrite.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Ask for references:</strong> Don't just look at the portfolio. Ask specifically to speak to a director they worked with <em>last year</em>.</li>
            <li><strong>Check their timeline:</strong> If they can't give you a specific delivery date for "Movement 2 Percussion," run away.</li>
          </ul>

          <h3>2. "Custom" Should Mean Custom</h3>
          <p>
            Many "custom" shows are just recycled templates with a new title. True custom design starts with <em>your</em> instrumentation 
            and <em>your</em> students' ability levels.
          </p>
          <p>
            If a designer doesn't ask for your <strong>Instrumentation List</strong> or <strong>Soloist Capabilities</strong> before writing a single note, 
            they aren't writing for <em>your</em> band. They are writing for a MIDI file.
          </p>

          <h3>3. The "Rewrite" Policy</h3>
          <p>
            This is the hidden cost that blows up budgets. What happens if the woodwind feature is too hard? 
            What if your drill writer needs 16 more counts in the ballad?
          </p>
          <p>
            Most designers charge $100-$300 per hour for edits. 
            <strong>We offer unlimited difficulty adjustments at no extra cost.</strong> If it doesn&apos;t work on the field, we fix it. Period.
          </p>

          <h3>4. Understanding the Cost</h3>
          <p>
            Cheap design is expensive. Saving $500 on the front end often costs you hours of rehearsal time rewriting unplayable parts, 
            or points on the sheets because the orchestration is muddy.
          </p>
        </div>

        <Card className="bg-muted/30 border-none mb-16 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center font-heading text-2xl">The Bright Designs Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-4 text-red-500 flex items-center gap-2"><X /> Typical Designer</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> "I'll get to it when I can" communication</li>
                  <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Charges hourly for every rewrite</li>
                  <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Delivers PDF parts late in July</li>
                  <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> One-size-fits-all difficulty</li>
                  <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Writes impossible woodwind runs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-brand-turf flex items-center gap-2"><Check /> Bright Designs</h4>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Guaranteed 24-hour response time</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> <strong>Free</strong> difficulty adjustments forever</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Complete parts package by June 1st</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Tailored to your specific instrumentation</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Educational & achievable scoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-brand-midnight text-white p-8 rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-4">Ready for a stress-free season?</h3>
          <p className="mb-8 text-gray-300">
            Let's discuss your band's goals and how we can design a vehicle for your success.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-brand-electric text-brand-midnight hover:bg-white" asChild>
              <Link href="/contact">Schedule a Consultation</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
              <Link href="/shows">Browse Our Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
