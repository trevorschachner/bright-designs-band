import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-bright-third relative">
      <div className="container mx-auto text-center">
        <div className="max-w-3xl mx-auto text-white">
          <h2 className="text-4xl font-bold mb-6 font-primary">Give your students a show they deserve to perform.</h2>
          <p className="text-xl mb-8 opacity-90">
            Ready to work with designers who get it? Join the growing family of programs who&apos;ve discovered what it&apos;s like to work with partners who respect your vision, understand your students, and deliver exceptional design on time, every time. Let&apos;s talk about what we can create together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-secondary btn-lg" asChild>
              <Link href="/contact">Schedule Consultation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

