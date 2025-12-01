import React from "react"

type PageHeroProps = {
  title: React.ReactNode
  subtitle?: string
  align?: "center" | "left"
  id?: string
  className?: string
  containerClassName?: string
  children?: React.ReactNode
}

export function PageHero({
  title,
  subtitle,
  align = "center",
  id,
  className,
  containerClassName,
  children,
}: PageHeroProps) {
  const alignment = align === "center" ? "text-center" : "text-left"

  return (
    <section id={id} className={`plus-section rounded-b-3xl ${className ?? ""}`}>
      <div className={`plus-container ${alignment} ${containerClassName ?? ""}`}>
        <h1 className="plus-h1 mb-4 text-brand-midnight">{title}</h1>
        {subtitle ? (
          <p className="plus-body-lg max-w-2xl mx-auto">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}

export default PageHero


