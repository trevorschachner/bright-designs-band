
import PageHero from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Music, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Alpharetta High School: Sophistication in Design | Bright Designs",
  description: "Custom wind and percussion arrangements tailored for Alpharetta High School's specific section strengths.",
};

export default function AlpharettaCaseStudy() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Alpharetta High School"
        subtitle="Sophisticated Design for Regional Finalist Success"
      />

      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12 border shadow-xl">
           <Image 
             src="/placeholder.svg" 
             alt="Alpharetta High School Marching Band"
             fill
             className="object-cover"
           />
        </div>

        <div className="prose prose-lg mx-auto">
          <div className="flex flex-wrap gap-4 mb-8 not-prose">
            <Badge variant="secondary" className="text-sm">Alpharetta, GA</Badge>
            <Badge className="text-sm bg-brand-midnight text-white">Program Coordination</Badge>
            <Badge className="text-sm bg-brand-electric text-brand-midnight">Music Design</Badge>
          </div>

          <h2>The Competitive Landscape</h2>
          <p>
            Alpharetta High School competes in the Atlanta metro area—one of the most competitive marching band regions in the country. 
            To stand out against national-caliber programs, &quot;clean&quot; isn&apos;t enough. You need to be <strong>artistically sophisticated</strong>.
          </p>
          <p>
            The program needed a design vehicle that could showcase their high individual achievement while presenting a cohesive, 
            intellectual, and emotional product that appealed to BOA (Bands of America) adjudication sheets.
          </p>

          <h2>The Solution: Custom Tailoring</h2>
          <p>
            As <strong>Program Coordinators</strong> and <strong>Music Designers</strong>, Bright Designs delivered a fully custom package designed to exploit the band&apos;s specific strengths.
          </p>

          <div className="my-10 space-y-6 not-prose">
            <div className="flex gap-4 items-start">
              <div className="bg-brand-electric/20 p-3 rounded-full text-brand-midnight">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Feature Moments</h4>
                <p className="text-muted-foreground">
                  We identified their top soloists early in the process and wrote specific features (e.g., Flute & Clarinet duets, Trombone quartets) 
                  that allowed them to max out the &quot;Individual Music&quot; caption.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-brand-electric/20 p-3 rounded-full text-brand-midnight">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Sonic Depth</h4>
                <p className="text-muted-foreground">
                  The arrangements utilized extended harmonies and varied textures. Instead of just &quot;loud,&quot; we explored the full dynamic range, 
                  creating moments of silence and intimacy that drew the audience in before hitting them with the full ensemble impact.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-brand-electric/20 p-3 rounded-full text-brand-midnight">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Percussion Integration</h4>
                <p className="text-muted-foreground">
                  The percussion book wasn&apos;t an afterthought. It was woven into the wind score, providing rhythmic drive and color 
                  without overpowering the melodic lines.
                </p>
              </div>
            </div>
          </div>

          <h2>The Outcome</h2>
          <p>
            Alpharetta has solidified its reputation as a sophisticated, high-achieving program.
            They are a consistent <strong>BOA Regional Finalist</strong>, earning high praise specifically for General Effect and Music Performance. 
            The custom design allows them to compete toe-to-toe with the largest programs in the Southeast by being smarter, clearer, and more musical.
          </p>
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" asChild>
            <Link href="/contact">Elevate Your Program</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
