import { Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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
    content: "Trevor and Brighton design cohesive shows that are achievable and engaging. They are flexible and will work with directors to craft a product suitable to individual programs strengths and needs.",
    author: "Kolman McMurphy",
    title: "Director of Bands",
    school: "Lexington HS"
  }
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-white relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-bright-dark font-primary">What Directors Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from the band directors who have worked with us to create award-winning shows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm h-full"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex-grow">
                  <Quote className="w-8 h-8 text-bright-third mb-4 opacity-60" />
                  <blockquote className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </blockquote>
                </div>
                <div className="border-t pt-4">
                  <div className="font-semibold text-bright-dark font-primary">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-bright-third">
                    {testimonial.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.school}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}