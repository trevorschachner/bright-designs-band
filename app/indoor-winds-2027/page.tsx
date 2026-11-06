import type { Metadata } from "next"
import Image from "next/image"
import { ArrowRight, Check, Copyright, Footprints, Mail, Music, Sparkles, Trophy } from "lucide-react"
import Link from "next/link"
import { contactHref } from "@/lib/contact-link"
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata"
import { Button } from "@/components/ui/button"
import { FreeShowForm } from "@/components/forms/free-show-form"
import { DrillYearArt } from "@/components/features/free-show/drill-year-art"
import { FREE_SHOW_DEADLINE_LABEL, FREE_SHOW_PATH, freeShowOpen } from "@/lib/free-show"

export const metadata: Metadata = buildMetadata({
  title: "2027 Indoor Winds Show Giveaway: Custom Wind Music and Drill | Bright Designs",
  description: "Enter your indoor winds group to win a custom show from Bright Designs: wind music and drill, with copyright costs covered. Free to enter. One winner, drawn at random.",
  keywords: [
    "free indoor winds show",
    "indoor winds show giveaway",
    "indoor winds drill",
    "indoor winds music",
    "WGI winds show",
  ],
  path: FREE_SHOW_PATH,
})

// Re-rendered hourly so the form gives way to the closed notice soon after the
// deadline; the API route enforces the deadline exactly.
export const revalidate = 3600

// Set to a file in /public (e.g. "/images/indoor-winds-2027-header.png") when
// the designed header graphic is ready; until then the hero shows DrillYearArt.
const HERO_GRAPHIC: string | null = null

const ticker = ["Wind music written for your group", "Drill charted for your members", "Copyright paid by us"]

const steps = [
  { title: "Enter", body: "Any indoor winds group can enter, free. Fill out the form below." },
  { title: "We draw a winner", body: `After entries close on ${FREE_SHOW_DEADLINE_LABEL}, we pick one group at random.` },
  { title: "We design your show", body: "We start with a call about your group and goals, then share concepts and drafts and revise them with your feedback." },
]

const rules = [
  "Free to enter.",
  "Open to any indoor winds group, scholastic or independent.",
  `Entries close at 11:59 p.m. Eastern on ${FREE_SHOW_DEADLINE_LABEL}, 2026.`,
  "We draw one winner at random after entries close and email the person who entered.",
  "The prize is one custom 2027 indoor winds show: wind music and drill designed by Bright Designs for the winning group, plus the copyright costs for that music.",
]

const hoverLift = "transition-transform duration-[calc(var(--count)/4)] ease-linear hover:-translate-y-1"

export default function IndoorWinds2027Page() {
  const open = freeShowOpen()

  return (
    <div className="free-show min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-midnight text-white rounded-3xl mx-2 md:mx-4 mt-2">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-brand-sky blur-[120px]" />
          <div className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-brand-electric/70 blur-[140px]" />
        </div>
        <div className="plus-container relative z-10 grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-electric/40 bg-brand-electric/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-fanfare text-brand-electric">
              <Sparkles className="h-3.5 w-3.5" />
              2027 Indoor Winds Giveaway
            </span>
            <h1 className="mt-6 font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Win a{" "}
              <span className="relative inline-block text-brand-electric">
                free
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path className="underline-draw" pathLength={1} d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{" "}
              indoor winds show.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-200 sm:text-xl">
              We&apos;ll design a custom show for one group, free. Enter by{" "}
              {FREE_SHOW_DEADLINE_LABEL}.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="h-14 bg-brand-electric px-8 text-base font-semibold text-brand-midnight hover:bg-brand-electric/90" asChild>
                <a href="#enter">
                  Enter the giveaway
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-300">
              {["Custom wind music", "Custom drill", "Copyright costs covered"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-sky" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            {HERO_GRAPHIC ? (
              <Image
                src={HERO_GRAPHIC}
                alt="2027 Indoor Winds Giveaway"
                width={1200}
                height={900}
                priority
                className="h-auto w-full rounded-2xl"
              />
            ) : (
              <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <DrillYearArt className="block h-auto w-full" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="mx-2 mt-2 overflow-hidden rounded-2xl md:mx-4">
        <div className="bg-brand-electric py-3">
          <div className="marquee-track flex w-max">
            {[0, 1].map(copy => (
              <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                {[...ticker, ...ticker].map((item, i) => (
                  <span key={i} className="flex items-center whitespace-nowrap px-6 font-heading text-sm font-bold uppercase tracking-fanfare text-brand-midnight sm:text-base">
                    {item}
                    <span className="ml-12 h-2 w-2 rounded-full bg-brand-midnight" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The prize */}
      <section className="py-20 sm:py-28">
        <div className="plus-container">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-fanfare text-brand-sky">The prize</p>
            <h2 className="plus-h2 text-brand-midnight">Your next show, written by our team</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We write the wind music and drill for your group and pay the copyright. You give feedback along the way.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className={`rounded-3xl border border-border bg-card p-8 shadow sm:p-10 ${hoverLift}`}>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-sky/15">
                <Music className="h-7 w-7 text-brand-midnight" />
              </div>
              <h3 className="mb-3 font-heading text-2xl font-bold text-brand-midnight">Wind music</h3>
              <p className="text-muted-foreground">Custom wind music, arranged for your instrumentation and your players&apos; strengths.</p>
            </div>
            <div className={`rounded-3xl border border-border bg-card p-8 shadow sm:p-10 ${hoverLift}`}>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-electric/25">
                <Footprints className="h-7 w-7 text-brand-midnight" />
              </div>
              <h3 className="mb-3 font-heading text-2xl font-bold text-brand-midnight">Drill</h3>
              <p className="text-muted-foreground">Custom drill for the whole show, written for your group&apos;s size and experience.</p>
            </div>
            <div className={`rounded-3xl border border-border bg-card p-8 shadow sm:p-10 ${hoverLift}`}>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-sky/15">
                <Copyright className="h-7 w-7 text-brand-midnight" />
              </div>
              <h3 className="mb-3 font-heading text-2xl font-bold text-brand-midnight">Copyright</h3>
              <p className="text-muted-foreground">We cover the copyright costs for the music.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-border bg-muted/30 py-20 sm:py-28">
        <div className="plus-container">
          <div className="mx-auto mb-24 max-w-2xl text-center">
            <h2 className="plus-h2 text-brand-midnight">How it works</h2>
          </div>
          <div className="relative">
            {/* An OpenMarch-style marcher walking a lane above the steps */}
            <div className="pointer-events-none absolute -top-6 left-[16.67%] right-[16.67%] hidden md:block" aria-hidden="true">
              <span className="step-marcher absolute top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-['courier_new',monospace] text-[11px] font-bold text-black">YOU</span>
                <span className="block h-3 w-3 rounded-full bg-[#FF0000]" />
              </span>
            </div>
            <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step, i) => (
                <li key={step.title} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-brand-midnight font-heading text-2xl font-bold text-brand-electric shadow-lg">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mb-2 font-heading text-xl font-bold text-brand-midnight">{step.title}</h3>
                  <p className="mx-auto max-w-xs text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Track record */}
      <section className="pt-20 sm:pt-28">
        <div className="plus-container">
          <div className={`flex flex-col items-start gap-4 rounded-3xl border-2 border-brand-electric bg-brand-electric/10 p-8 sm:flex-row sm:items-center sm:gap-6 sm:p-10 ${hoverLift}`}>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-midnight">
              <Trophy className="h-7 w-7 text-brand-electric" />
            </div>
            <p className="font-heading text-xl font-semibold text-brand-midnight sm:text-2xl">
              Our indoor winds shows have won WGI regional and circuit championships.
            </p>
          </div>
        </div>
      </section>

      {/* Enter */}
      <section id="enter" className="scroll-mt-24 py-20 sm:py-28">
        <div className="plus-container">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden rounded-3xl bg-brand-midnight p-8 text-white sm:p-10 lg:sticky lg:top-28">
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-sky/30 blur-3xl" />
                <p className="relative text-sm font-semibold uppercase tracking-fanfare text-brand-electric">Free to enter</p>
                <h2 className="relative mt-3 font-heading text-4xl font-bold leading-tight">Enter the giveaway</h2>
                <p className="relative mt-4 text-gray-300">
                  The winner is drawn at random. Your answers don&apos;t affect your odds, but we read every one.
                </p>
                <ul className="relative mt-8 space-y-3 text-sm text-gray-200">
                  {["Your name and email", "Your group's name, location and size", "How this would help your group", "Challenges from the past 12 months", "Whether you've worked with a design group"].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-electric" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#rules" className="relative mt-8 block text-sm font-medium text-brand-sky hover:underline">
                  Read the rules
                </a>
                <a href="mailto:hello@brightdesigns.band" className="relative mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-sky hover:underline">
                  <Mail className="h-4 w-4" />
                  Questions? hello@brightdesigns.band
                </a>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
                {open ? (
                  <FreeShowForm />
                ) : (
                  <div className="py-10 text-center">
                    <h3 className="font-heading text-3xl font-bold text-brand-midnight">Entries are closed</h3>
                    <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                      Entries closed on {FREE_SHOW_DEADLINE_LABEL}. We&apos;ll email the winner directly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section id="rules" className="scroll-mt-24 pb-20 sm:pb-28">
        <div className="plus-container">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-bold text-brand-midnight">Rules</h2>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {rules.map(rule => (
                <li key={rule} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-midnight" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Fall 2027 */}
      <section className="pb-20 sm:pb-28">
        <div className="plus-container">
          <div className="flex flex-col gap-8 rounded-3xl border border-border bg-muted/40 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-fanfare text-brand-sky">Fall 2027</p>
              <h2 className="plus-h2 text-brand-midnight">Not doing indoor winds?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We&apos;re booking marching shows now. Get in touch and we&apos;ll talk through
                music, drill and timeline for your band.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button size="lg" className={`h-14 bg-brand-midnight px-8 text-base font-semibold text-white hover:bg-brand-midnight/90 ${hoverLift}`} asChild>
                <Link href={contactHref("Fall 2027 marching show")}>
                  Get in touch
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base" asChild>
                <Link href="/shows">See our shows</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
