"use client"

import { Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface Testimonial {
  content: string
  author: string
  title: string
  school: string
}

const testimonials: Testimonial[] = [
  {
    content: "Professionalism, innovation, timeliness and the ability to listen, modify/adjust and grow with your program year to year has been a major part of our success. We have loved the entire process from idea to the state championship and welcome any chance to sing Brighton and Trevor's praises.",
    author: "Dr. Chris Lee",
    title: "Director of Bands",
    school: "Dreher High School"
  },
  {
    content: "Our show Spices, Perfumes, Toxins came together so quickly and this process has been one of the most fun I have ever been a part of. Creating competitive art as a team is truly difficult and this team was such a joy to work with and be around since we started this journey last January.",
    author: "Jared Kaufman",
    title: "Assistant Director of Bands",
    school: "Alpharetta HS"
  },
  {
    content: "A wind book that was perfectly constructed from top to bottom! The Bright Designs Team is the definition of professional and timely in all they do. The kids had a blast performing this music, and we had just as much fun teaching it.",
    author: "Dillon Watkins",
    title: "Director of Bands",
    school: "Houston County High School"
  },
  {
    content: "Bright Designs is a phenomenal choice for anyone in need of timely, professional and accomplished music arranging services. The quality of the entire product is always outstanding and they work hard to write to the needs of your program.",
    author: "Tyler Vandermeer",
    title: "Director of Bands",
    school: "Columbine High School"
  },
  {
    content: "Trevor and Brighton design cohesive shows that are achievable and engaging. They are flexible and will work with directors to craft a product suitable to individual programs strengths and needs.",
    author: "Kolman McMurphy",
    title: "Director of Bands",
    school: "Lexington HS"
  }
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="plus-section bg-brand-midnight/95 text-white my-8 mx-2 md:mx-4 relative z-10 rounded-3xl overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[140%] rounded-full bg-brand-sky blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] rounded-full bg-brand-electric blur-[150px]" />
      </div>

      <div className="plus-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="plus-h2 mb-4 !text-brand-sky">What Directors Say</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Don&apos;t take our word for it—listen to directors who&apos;ve been in your shoes.
          </p>
        </div>

        <div className="relative px-8 md:px-12 lg:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="h-full border-none bg-white/10 backdrop-blur-sm text-white hover:bg-white/15 transition-colors duration-300">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex-grow">
                        <Quote className="w-8 h-8 text-brand-electric mb-4 opacity-80" />
                        <blockquote className="text-sm leading-relaxed italic text-gray-200 mb-6">
                          &quot;{testimonial.content}&quot;
                        </blockquote>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <div className="font-semibold text-white">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-brand-electric">
                          {testimonial.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {testimonial.school}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 md:-left-12 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
            <CarouselNext className="right-0 md:-right-12 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}