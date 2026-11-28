import type { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '@/lib/content/legal'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy | Bright Designs',
  description: 'What Bright Designs collects on brightdesigns.band, why, and how to ask us to delete it.',
  path: '/privacy',
})

// Kept deliberately short. Every claim matches what the site does (see the PR
// for issue #100). When the site starts collecting something new, update this
// page and LEGAL_LAST_UPDATED in lib/content/legal.ts.
export default function PrivacyPolicyPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto prose lg:prose-xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: <time dateTime={LEGAL_LAST_UPDATED.iso}>{LEGAL_LAST_UPDATED.label}</time>
        </p>

        <p>
          This policy covers brightdesigns.band, run by {LEGAL_ENTITY} (“we”). Questions go to {mail}.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>What you put in our forms:</strong> your name, email, school or program, role, and anything else
            you tell us about your band or the show you’re interested in.
          </li>
          <li>
            <strong>Sent along with a form:</strong> your IP address, browser, and the pages you visited before you got
            in touch, so we can stop spam and see how people find us.
          </li>
          <li>
            <strong>Analytics:</strong> we use PostHog to see which pages people visit, what they click and which
            tracks they play. PostHog also records about 25% of visits so we can see how the site is used. Anything
            typed into a form is hidden from those recordings.
          </li>
        </ul>

        <h2>Perusal scores</h2>
        <p>
          When you request perusal scores, we keep your details and a record of which scores you open, and we stamp
          your name and school on each one. We remember your request in your browser for 30 days, so you don’t have to
          fill in the form again.
        </p>

        <h2>How we use it</h2>
        <p>
          To answer you, follow up about our shows, run the free show program, provide perusal scores, and improve the
          site. We don’t sell your information or use it for advertising.
        </p>

        <h2>Who helps us run the site</h2>
        <p>
          Netlify (hosting), Supabase (database and files), PostHog (analytics), Attio (our customer records), Resend
          (email) and Cloudflare Turnstile (spam protection). Videos are played through YouTube. They only get what
          they need to do that job.
        </p>

        <h2>Your choices</h2>
        <p>
          Email {mail} to see or delete what we have about you, or to stop hearing from us. To keep out of our
          analytics, block cookies or use a tracker blocker; the site still works.
        </p>

        <h2>Children</h2>
        <p>
          The site is for band directors, staff and students. We don’t knowingly collect information from anyone under
          13. If you think a child has sent us something, email us and we’ll delete it.
        </p>

        <h2>Changes</h2>
        <p>
          If we change this policy we’ll update the date above. See also our <Link href="/terms">Terms of Use</Link>.
        </p>
      </div>
    </div>
  )
}
