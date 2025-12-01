import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-brand-midnight relative overflow-hidden rounded-3xl my-4 mx-2 md:mx-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[140%] rounded-full bg-brand-sky blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[120%] rounded-full bg-brand-electric blur-[100px]" />
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white leading-tight">
            Give your students a show <span className="text-brand-sky">they deserve to perform.</span>
          </h2>
          <p className="text-xl mb-10 text-gray-200 leading-relaxed">
            Ready to work with designers who get it? Join the growing family of programs who&apos;ve discovered what it&apos;s like to work with partners who respect your vision, understand your students, and deliver exceptional design on time, every time. Let&apos;s talk about what we can create together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-brand-electric text-brand-midnight hover:bg-brand-electric/90 font-semibold text-lg px-8 h-12" asChild>
              <Link href="/contact">
                Schedule Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

