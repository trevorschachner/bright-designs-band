
import PageHero from "@/components/layout/page-hero";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Success Stories & Case Studies | Bright Designs",
  description: "Read how Bright Designs has helped bands like Travelers Rest, Dorman, and Alpharetta achieve competitive success.",
};

export default function CaseStudiesIndex() {
  const caseStudies = [
    {
      slug: "travelers-rest",
      school: "Travelers Rest High School",
      location: "Travelers Rest, SC",
      badge: "State Medalist",
      description: "From 14th place and out of finals to a consistent top-3 State Medalist.",
      image: "/placeholder.svg"
    },
    {
      slug: "dorman",
      school: "Dorman High School",
      location: "Roebuck, SC",
      badge: "5A State Finalist",
      description: "maintaining clarity and excellence with a massive 5A ensemble.",
      image: "/placeholder.svg"
    },
    {
      slug: "alpharetta",
      school: "Alpharetta High School",
      location: "Alpharetta, GA",
      badge: "BOA Finalist",
      description: " sophisticated design for high-level regional competition.",
      image: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen">
      <PageHero
        title="Success Stories"
        subtitle="Real results from programs just like yours."
      />

      <section className="py-16 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/resources/blog/case-studies/${study.slug}`} className="group h-full">
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4 border-t-brand-electric">
                <div className="relative h-48 bg-muted">
                  <Image 
                    src={study.image} 
                    alt={study.school}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="font-bold flex items-center gap-1 shadow-sm">
                      <Trophy className="w-3 h-3 text-brand-electric" />
                      {study.badge}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-brand-electric transition-colors">{study.school}</CardTitle>
                  <CardDescription>{study.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{study.description}</p>
                </CardContent>
                <CardFooter>
                  <div className="text-brand-electric font-medium text-sm flex items-center">
                    Read Case Study <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Ready to be our next success story?</p>
          <Button size="lg" asChild>
            <Link href="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
