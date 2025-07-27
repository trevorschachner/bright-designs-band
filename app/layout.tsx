import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { MainNav } from "./components/main-nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Bright Designs - Marching Band Show Design",
  description:
    "Craft extraordinary marching band shows with innovative arrangements and complete show designs that captivate audiences and elevate performances.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-secondary`}>
        <MainNav>{children}</MainNav>
      </body>
    </html>
  )
}
