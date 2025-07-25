import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold mb-6 font-primary text-bright-dark">Our Services</h1>
      <p className="text-lg max-w-2xl mb-8 text-gray-600">
        Learn more about our offerings on the home page.
      </p>
      <Link href="/#services" className="text-bright-third hover:underline text-lg font-medium">
        View Services Section
      </Link>
    </div>
  )
}