import type { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '@/lib/content/legal'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Use | Bright Designs',
  description:
    'The terms for using brightdesigns.band, including what you may and may not do with Bright Designs perusal scores.',
  path: '/terms',
})

// Change LEGAL_LAST_UPDATED in lib/content/legal.ts whenever this wording changes.
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
          brightdesigns.band is run by {LEGAL_ENTITY} (“Bright Designs”, “we”). By using the site you agree to these
          terms. If you don’t agree, please don’t use the site.
        </p>

        <h2>What the site is for</h2>
        <p>
          The site lets you browse our marching band shows and arrangements, listen to previews, view perusal scores,
          and get in touch with us. Buying or licensing a show, an arrangement or custom work is covered by a separate
          written agreement with us. If that agreement conflicts with these terms, the agreement wins.
        </p>

        <h2>Our content</h2>
        <p>
          The music, recordings, scores, show designs, text, images and logos on this site belong to Bright Designs or
          to the people who licensed them to us, and are protected by copyright and other laws. You may view and listen
          to them on the site to decide whether a show is right for your program. You may not download, copy, record,
          republish or sell them except as these terms allow.
        </p>

        <h2>Perusal scores</h2>
        <p>
          A perusal score is a watermarked copy of a full score that we provide so you can study the music while you
          decide whether to license a show.
        </p>
        <ul>
          <li>
            <strong>Perusal only.</strong> You may read a perusal score and keep the copy you downloaded for your own
            review. That is the only use allowed.
          </li>
          <li>
            <strong>What you may not do.</strong> You may not perform any part of a perusal score, in rehearsal or in
            public; copy, print for others, share, post, distribute or sell it; make an arrangement from it, adapt it,
            or use it to create parts; or remove or cover the watermark.
          </li>
          <li>
            <strong>Performing needs a license.</strong> To rehearse or perform the music you must buy a license from
            Bright Designs. A perusal score gives you no right to perform, record or broadcast the music.
          </li>
          <li>
            <strong>Scores stay ours.</strong> Perusal scores remain the property of Bright Designs. The underlying music
            may also belong to its composers and publishers. Viewing or downloading a score does not transfer any
            ownership or license to you.
          </li>
          <li>
            <strong>Accurate details.</strong> Give your real name, school or program, and role when you request
            scores. Each copy is stamped with those details and is for the person named on it.
          </li>
          <li>
            <strong>Limits and withdrawal.</strong> Access is limited to 15 scores a day. We may change the limit, or
            withdraw your access to perusal scores, at any time and for any reason, including if we believe these terms
            have been broken.
          </li>
        </ul>

        <h2>Using the site</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the site for anything unlawful;</li>
          <li>send false information through our forms, or request scores in someone else’s name;</li>
          <li>scrape the site, or use bots or scripts to download content in bulk;</li>
          <li>get around the score limits, the spam check, or any other access control;</li>
          <li>interfere with the site or try to reach parts of it you aren’t allowed to.</li>
        </ul>
        <p>We may suspend or end your access to the site if you break these terms.</p>

        <h2>Your information</h2>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> explains what we collect when you use the site and how we use
          it.
        </p>

        <h2>Other sites</h2>
        <p>
          The site links to and embeds content from other services, such as YouTube. We don’t control them and aren’t
          responsible for their content or practices.
        </p>

        <h2>No warranties</h2>
        <p>
          The site and everything on it, including previews and perusal scores, are provided “as is” and “as
          available”, without warranties of any kind, express or implied. Previews and perusal scores may differ from
          the final music you license. We don’t promise the site will be error-free or always available.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, Bright Designs and its owners, employees and contractors are not liable
          for any indirect, incidental, special, consequential or punitive damages, or for any lost profits or data,
          arising from your use of the site or its content, even if we were told such damages were possible.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. When we do, we’ll change the date at the top of this page. Using the site after a
          change means you accept the updated terms.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the State of South Carolina, without regard to its conflict of law
          rules. Any dispute about the site or these terms will be heard in the state or federal courts located in South
          Carolina.
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
