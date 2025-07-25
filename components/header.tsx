import Link from "next/link"

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <Link href="/" className="text-2xl font-bold">
        Bright Designs
      </Link>
      <nav>
        <ul className="flex space-x-4">
          <li><Link href="/about" className="hover:underline">About</Link></li>
          <li><Link href="/services" className="hover:underline">Services</Link></li>
          <li><Link href="/contact" className="hover:underline">Contact</Link></li>
        </ul>
      </nav>
    </header>
  )
} 