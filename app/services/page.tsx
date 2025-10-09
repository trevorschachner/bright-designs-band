import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold mb-6 font-primary text-foreground text-center">Our Services</h1>
        <p className="text-lg max-w-2xl mx-auto mb-12 text-muted-foreground text-center">
          Explore our offerings below. You can also view a summary on the homepage services section.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 frame-card text-center">
            <h3 className="text-xl font-semibold mb-2 font-primary">Custom Shows</h3>
            <p className="text-muted-foreground">Complete show design built from the ground up to match your band&apos;s personality.</p>
          </div>
          <div className="p-6 frame-card text-center">
            <h3 className="text-xl font-semibold mb-2 font-primary">Arrangements</h3>
            <p className="text-muted-foreground">Professional music arrangements that highlight your ensemble&apos;s unique sound.</p>
          </div>
          <div className="p-6 frame-card text-center">
            <h3 className="text-xl font-semibold mb-2 font-primary">Consultation</h3>
            <p className="text-muted-foreground">Expert advice on show concepts, rehearsal strategies, and adjudication preparedness.</p>
          </div>
          <div className="p-6 frame-card text-center">
            <h3 className="text-xl font-semibold mb-2 font-primary">Music Licensing</h3>
            <p className="text-muted-foreground">Hassle-free licensing assistance to keep your performances compliant.</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link href="/#services" className="text-bright-third hover:underline text-lg font-medium">
            View Services Section on Home
          </Link>
        </div>
      </div>
    </div>
  )
}