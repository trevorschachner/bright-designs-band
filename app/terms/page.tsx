import type { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '@/lib/content/legal'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Use | Bright Designs',
  description: 'The terms for using brightdesigns.band, including how you may use Bright Designs perusal scores.',
  path: '/terms',
})

// Kept deliberately short. Change LEGAL_LAST_UPDATED in lib/content/legal.ts
// whenever this wording changes.
export default function TermsOfUsePage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto prose lg:prose-xl dark:prose-invert">
        <h1>Terms of Use</h1>
        <p className="text-muted-foreground">
          Last updated: <time dateTime={LEGAL_LAST_UPDATED.iso}>{LEGAL_LAST_UPDATED.label}</time>
        </p>

        <p>
          brightdesigns.band is run by {LEGAL_ENTITY} (“we”). By using the site you agree to these terms and our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Our content</h2>
        <p>
          The music, recordings, scores, designs and images on this site belong to us or the people we license them
          from. You’re welcome to browse and listen to decide whether a show is right for your program. Please don’t
          copy, record, share or reuse them otherwise.
        </p>

        <h2>Perusal scores</h2>
        <p>
          Perusal scores are stamped “PERUSAL ONLY” and are for reviewing the music. You may download and print them,
          and share them with the staff of your own program. Please don’t perform from them, arrange from them, post
          them online, share them outside your program or remove the stamp. To rehearse or perform a show, you must buy
          a license from Bright Designs. We may limit or stop access to perusal scores at any time.
        </p>

        <h2>Licensing a show</h2>
        <p>
          Buying or licensing a show is covered by a separate written agreement with us. If it conflicts with these
          terms, the agreement wins.
        </p>

        <h2>No guarantees</h2>
        <p>
          The site is provided as is. Previews and perusal scores may differ from the final music. As far as the law
          allows, we aren’t liable for any loss from using the site, and never for more than $100.
        </p>

        <h2>Changes and governing law</h2>
        <p>
          We may update these terms; the date above shows the latest version. These terms are governed by the laws of
          the State of South Carolina.
        </p>

        <h2>Contact</h2>
        <p>
          {LEGAL_ENTITY}
          <br />
          {mail}
        </p>
      </div>
    </div>
  )
}
