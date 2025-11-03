import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"
import { Calendar, Eye, Music, Users, Play, ArrowRight } from "lucide-react"

export type ServiceItem = {
  title: string
  description: string
  icon?: keyof typeof iconMap
}

export type ServicesGridProps = {
  heading?: string
  description?: string
  items: ServiceItem[]
  cta?: {
    label: string
    href: string
    iconRight?: boolean
  }
}

const iconMap = {
  music: Music,
  eye: Eye,
  calendar: Calendar,
  users: Users,
  play: Play,
} as const

export function ServicesGrid({ items, cta }: ServicesGridProps) {

  return (
    <section id="services" className="plus-section bg-muted/30">
      <div className="plus-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {items.map(({ title, description: itemDescription, icon }, index) => {
            const IconComp = icon ? iconMap[icon] ?? Music : Music
            return (
            <Card key={`${title}-${index}`} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconComp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="plus-h3">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="plus-body-sm">{itemDescription}</p>
              </CardContent>
            </Card>
            )
          })}
        </div>

        {cta ? (
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href={cta.href}>
                {cta.label}
                {cta.iconRight ? <ArrowRight className="ml-2 w-5 h-5" /> : null}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ServicesGrid


