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

// Structure and clauses follow OpenMarch's terms of service, minus accounts,
// the desktop app, payments and arbitration, which this site does not have.
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

        <h2>1. Agreement</h2>
        <p>
          These Terms of Use (the “Terms”) are a binding agreement between you and {LEGAL_ENTITY} (“Bright Designs”,
          “we”, “our”, “us”) about your use of brightdesigns.band (the “Site”). By using the Site in any way, you agree
          to these Terms.
        </p>
        <p>
          If you use the Site on behalf of a school, booster organization or other entity, “you” also means that
          entity, and you confirm that you are authorized to act for it.
        </p>

        <h2>2. Changes to these Terms</h2>
        <p>
          We may change these Terms at any time. The date of the last change is posted at the top. Please check back
          for updates. By continuing to use the Site after a change, you agree to the updated Terms.
        </p>

        <h2>3. Privacy</h2>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> explains what personal information we collect through the
          Site and how we handle it.
        </p>

        <h2>4. The Site</h2>
        <p>
          On the Site you can browse our marching band shows and arrangements, listen to previews, view perusal scores,
          request our guides, and get in touch with us.
        </p>

        <h2>5. Licensing a show</h2>
        <p>
          You cannot buy or license anything through the Site. Licensing a show or an arrangement, or commissioning
          custom work, is covered by a separate written agreement between you and Bright Designs. If that agreement
          conflicts with these Terms, the agreement controls.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You may use the Site as long as you follow these Terms. In particular:</p>
        <ul>
          <li>You may use the Site only for lawful purposes.</li>
          <li>
            You may not send false information through our forms, send information you have no right to send, or
            request scores in someone else’s name.
          </li>
          <li>You may not bulk copy or “scrape” any part of the Site with a bot or other tool.</li>
          <li>
            You may not defeat, avoid or bypass the daily score limit, the spam check, the watermark or any other
            protection on the Site.
          </li>
          <li>You may not send viruses or other malicious code to or through the Site.</li>
          <li>You may not interfere with the Site or try to reach parts of it that are not open to you.</li>
        </ul>

        <h2>7. Content</h2>
        <h3>7.1 Bright Designs content</h3>
        <p>
          As between you and Bright Designs, we or our licensors own everything on the Site, including the music,
          recordings, scores, show designs, text, images, videos and logos (the “Bright Designs Content”). Some of the
          music is arranged from works owned by other composers and publishers, who keep their rights in it.
        </p>
        <p>
          As long as you follow these Terms, you may view and listen to the Bright Designs Content on the Site to decide
          whether a show suits your program. That permission is limited, non-exclusive and non-transferable. You may not
          copy, record, adapt, distribute, sell, publicly display, perform or broadcast the Bright Designs Content
          except as these Terms expressly allow. No other license or right is granted to you, by implication or
          otherwise.
        </p>
        <h3>7.2 What you send us</h3>
        <p>
          You are responsible for the information you send through our forms. We use it as our{' '}
          <Link href="/privacy">Privacy Policy</Link> describes.
        </p>

        <h2>8. Perusal scores</h2>
        <p>
          A perusal score is a watermarked copy of a score that we make available so you can study the music while you
          decide whether to license it. Section 7 applies to perusal scores, and so do these rules:
        </p>
        <ul>
          <li>
            <strong>Perusal only.</strong> You may read a perusal score to evaluate the music for your own program. No
            other use is allowed.
          </li>
          <li>
            <strong>No performing.</strong> You may not perform any part of a perusal score, in rehearsal or in public.
          </li>
          <li>
            <strong>No copying or sharing.</strong> You may not copy or distribute a perusal score, in print or as a
            file.
          </li>
          <li>
            <strong>No arranging or adapting.</strong> You may not arrange from a perusal score, adapt it, or extract
            parts from it.
          </li>
          <li>
            <strong>Leave the watermark.</strong> Every page is watermarked “PERUSAL ONLY” with the name and school you
            gave us and the date. You may not remove, cover or alter the watermark.
          </li>
          <li>
            <strong>Performing requires a license.</strong> To rehearse or perform the music, you must buy a license
            from Bright Designs. A perusal score gives you no right to perform, record or broadcast the music.
          </li>
          <li>
            <strong>Scores stay ours.</strong> Perusal scores remain the property of Bright Designs. Opening or
            downloading one transfers no ownership and no license beyond what this section allows.
          </li>
          <li>
            <strong>Accurate details.</strong> Give your real name, school or program, and role when you request
            scores.
          </li>
          <li>
            <strong>Limits and withdrawal.</strong> You can open up to 15 different scores a day. We may change that
            limit or withdraw your access to perusal scores at any time, for any reason.
          </li>
        </ul>

        <h2>9. Feedback</h2>
        <p>
          We welcome feedback and suggestions about the Site and our shows. If you send us any, we may use it without
          owing you credit or payment.
        </p>

        <h2>10. Third-party services</h2>
        <p>
          The Site links to and embeds content from services we do not control, such as YouTube and OpenStreetMap. Your
          use of them is subject to their own terms. We make no promises about their content or operation and are not
          responsible for any harm that results from your use of them.
        </p>

        <h2>11. Changes to the Site</h2>
        <p>
          We may change the Site, or remove shows, previews and perusal scores from it, at any time. We are not liable
          for any consequences of those changes.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may end these Terms and block your access to the Site immediately and without notice if we determine that
          you have breached them. Provisions that by their nature should survive will survive, including the limits on
          our liability, the terms on ownership and intellectual property, the restrictions on perusal scores, and the
          terms on disputes between us.
        </p>

        <h2>13. Disclaimer of warranties</h2>
        <p>
          YOU USE THE SITE AT YOUR OWN RISK. THE SITE AND THE BRIGHT DESIGNS CONTENT, INCLUDING PREVIEWS AND PERUSAL
          SCORES, ARE PROVIDED “AS IS”, AND BRIGHT DESIGNS DISCLAIMS ALL WARRANTIES, EXPRESS AND IMPLIED, INCLUDING ANY
          WARRANTIES OF ACCURACY, RELIABILITY, MERCHANTABILITY, NON-INFRINGEMENT AND FITNESS FOR A PARTICULAR PURPOSE.
          WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED OR FREE OF ERRORS, OMISSIONS OR VIRUSES.
        </p>
        <p>
          Previews and perusal scores may differ from the music we deliver under a license. Because some states do not
          permit disclaimer of implied warranties, you may have additional rights under your local laws.
        </p>

        <h2>14. Limitation of liability</h2>
        <p>
          TO THE FULLEST EXTENT ALLOWED BY APPLICABLE LAW, UNDER NO CIRCUMSTANCES AND UNDER NO LEGAL THEORY (INCLUDING
          TORT, CONTRACT, STRICT LIABILITY OR OTHERWISE) WILL BRIGHT DESIGNS BE LIABLE TO YOU OR TO ANY OTHER PERSON FOR
          (A) ANY INDIRECT, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING DAMAGES FOR LOST
          PROFITS, LOSS OF GOODWILL, WORK STOPPAGE, OR COMPUTER FAILURE OR MALFUNCTION, (B) ANY AMOUNT, IN THE
          AGGREGATE, IN EXCESS OF ONE HUNDRED U.S. DOLLARS (US$100), OR (C) ANY MATTER BEYOND OUR REASONABLE CONTROL.
          SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO THE ABOVE LIMITATION AND
          EXCLUSIONS MAY NOT APPLY TO YOU.
        </p>
        <p>This section covers your use of the Site. A separate written agreement with us has its own terms.</p>

        <h2>15. Notices</h2>
        <p>
          We will give any notice under these Terms in writing, either by email to the address you gave us or by posting
          it on the Site.
        </p>

        <h2>16. No waiver</h2>
        <p>If we do not enforce a right or provision of these Terms, we have not waived our right to enforce it later.</p>

        <h2>17. Assignment</h2>
        <p>
          You may not assign or transfer these Terms without our prior written consent, and any attempt to do so is
          void. We may assign or transfer these Terms without restriction. These Terms bind and benefit the parties and
          their successors and permitted assigns, and give no rights to anyone else.
        </p>

        <h2>18. Severability</h2>
        <p>
          If a court of competent jurisdiction finds any provision of these Terms invalid or unenforceable, that
          provision will be enforced to the maximum extent permissible and the rest of these Terms will remain in full
          force and effect.
        </p>

        <h2>19. Governing law and venue</h2>
        <p>
          These Terms are governed by and will be construed under the laws of the State of South Carolina, without
          regard to its conflict of laws provisions. You and Bright Designs consent to the exclusive jurisdiction and
          venue of the state and federal courts located in South Carolina for any dispute arising from these Terms or
          your use of the Site.
        </p>
        <p>
          A breach of Section 6 (Acceptable use), Section 7 (Content) or Section 8 (Perusal scores) would cause us harm
          that money alone cannot repair. For such a breach we may seek an injunction or other equitable relief from
          any court of competent jurisdiction.
        </p>

        <h2>20. Entire agreement</h2>
        <p>
          These Terms are the entire agreement between you and Bright Designs about your use of the Site and supersede
          all prior written or oral agreements about it. They do not replace a separate written agreement described in
          Section 5.
        </p>

        <h2>21. Contact us</h2>
        <p>If you have questions about the Site or these Terms, contact us.</p>
        <p>
          {LEGAL_ENTITY}
          <br />
          {mail}
        </p>
      </div>
    </div>
  )
}
