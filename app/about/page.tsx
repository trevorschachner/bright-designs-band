import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold mb-6 font-primary text-bright-dark">About Bright Designs</h1>
      <p className="text-lg max-w-2xl mb-8 text-gray-600">
        Discover our mission and story on the home page.
      </p>
      <Link href="/#about" className="text-bright-third hover:underline text-lg font-medium">
        Go to About Section
      </Link>
    </div>
  )
}