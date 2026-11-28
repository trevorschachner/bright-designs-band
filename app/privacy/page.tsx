import type { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '@/lib/content/legal'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy | Bright Designs',
  description:
    'What Bright Designs collects on brightdesigns.band, why, who processes it for us, and how to opt out or ask us to delete your information.',
  path: '/privacy',
})

// Structure and clauses follow OpenMarch's privacy policy, cut down to what
// this site does. Every claim is checked against the code (see the PR for
// issue #100). When the site starts collecting something new, update this page
// and LEGAL_LAST_UPDATED in lib/content/legal.ts.
export default function PrivacyPolicyPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto prose lg:prose-xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: <time dateTime={LEGAL_LAST_UPDATED.iso}>{LEGAL_LAST_UPDATED.label}</time>
        </p>

        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy (the “Policy”) explains how {LEGAL_ENTITY} (“Bright Designs”, “we”, “our”) collects, uses
          and discloses personal information through brightdesigns.band (the “Site”).
        </p>

        <h2>2. Information we collect and how we use it</h2>
        <p>
          You give us some information when you fill in a form. We collect other information automatically when you
          use the Site. This section lists both and says what we use each for.
        </p>

        <h3>2.1 Forms</h3>
        <ul>
          <li>
            <strong>Inquiry and contact forms.</strong> Your name, email, school or organization, band size, ability
            level, the services and show you’re asking about, your notes, how you heard about us and who referred you.
            We use this to answer you and to follow up about our shows and services.
          </li>
          <li>
            <strong>Free guide requests.</strong> Your name, email, school and role. We use this to send you the guide
            and to follow up.
          </li>
          <li>
            <strong>Free show entries.</strong> Your name, email, role, group or school, location, group size, your
            answers about your program, and whether you’ve worked with a design group before. We use this to review
            entries and run the program.
          </li>
          <li>
            <strong>Perusal score requests.</strong> Your name, email, school or program, and role. Section 2.2 explains
            how we use this.
          </li>
        </ul>
        <p>If you email us, we also have whatever you send.</p>

        <h3>2.2 Perusal scores</h3>
        <ul>
          <li>Sending the score request form once unlocks perusal scores in that browser for 30 days.</li>
          <li>
            We log each score you open and when you opened it. You can open up to 15 different scores a day, counted by
            email address and by browser. If you reach that limit, our team gets one email about it and your record is
            tagged.
          </li>
          <li>
            Every page of a perusal score is watermarked “PERUSAL ONLY” with your name, your school and the date. Anyone
            who sees the file sees that watermark.
          </li>
          <li>
            You are added to our customer records as a lead, along with the scores you opened. We may contact you about
            them.
          </li>
        </ul>

        <h3>2.3 Information sent with each form</h3>
        <p>
          When you send any form, we also record your IP address, your browser’s user agent, the page you sent the form
          from and the page you were on before it, how you first reached the Site (the referring site, the first page
          you landed on, and any campaign tags in that link), and your analytics visitor ID. We use this to block spam,
          to learn which pages and referrals lead people to contact us, and to see what you looked at before you got in
          touch. To limit spam, we also keep a count of form submissions from each IP address.
        </p>

        <h3>2.4 Analytics and session recordings</h3>
        <p>
          We use PostHog to see how the Site is used and to fix problems. PostHog records the pages you view, what you
          click, the audio previews you play, the perusal scores you open, errors in the page, your browser and device
          type, and the site that referred you. PostHog receives your IP address and derives an approximate location
          from it. We do not send PostHog your name or email to identify you.
        </p>
        <p>
          PostHog also records about 1 in 4 visits (25%) as a session recording. A recording replays the pages as you
          saw them, with your mouse movement, clicks and scrolling. Anything you type into a form field is masked and
          is not recorded. By using the Site, you consent to these recordings. Section 6 explains how to opt out.
        </p>
        <p>
          We do not use advertising trackers. We do not sell your personal information, and we do not share it for
          targeted advertising.
        </p>

        <h3>2.5 Cookies and browser storage</h3>
        <p>
          The Site does not show a cookie banner. “Cookies” are small text files stored by your browser. This is what
          the Site stores there:
        </p>
        <ul>
          <li>
            <strong>Analytics.</strong> A PostHog cookie and local storage entry holding a random visitor ID and the
            current session.
          </li>
          <li>
            <strong>Perusal score access.</strong> A cookie that remembers you sent the score request form. It lasts
            30 days.
          </li>
          <li>
            <strong>How you found us.</strong> A local storage entry with the referring site, landing page and campaign
            tags from your first visit. It stays until you clear your browser storage. A second entry, kept only while
            the tab is open, remembers the page you were on before the current one.
          </li>
          <li>
            <strong>Display preference.</strong> Whether you chose grid or list view for shows.
          </li>
          <li>
            <strong>Staff sign-in.</strong> Sign-in cookies used only by our team.
          </li>
        </ul>

        <h2>3. Disclosure of information</h2>
        <p>We disclose personal information to the categories of third parties listed in this section.</p>

        <h3>3.1 Service providers</h3>
        <p>We rely on other companies to run the Site. Each one receives the information it needs to do its job.</p>
        <ul>
          <li>
            <strong>Netlify</strong> hosts the Site and runs the code that receives forms. Like any host, it keeps
            request logs.
          </li>
          <li>
            <strong>Supabase</strong> holds our database (form submissions, score requests, the show catalog), our
            files and staff sign-in.
          </li>
          <li>
            <strong>PostHog</strong> provides the analytics and session recordings described in Section 2.4. It stores
            them in the United States.
          </li>
          <li>
            <strong>Attio</strong> is our customer records system. Inquiries, guide requests and score requests become
            leads there.
          </li>
          <li>
            <strong>Resend</strong> sends our email, including form confirmations and notices to our team.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> checks that forms are sent by people and not bots. It runs on pages
            that have a form.
          </li>
        </ul>

        <h3>3.2 Embedded content</h3>
        <p>
          Videos load from YouTube’s youtube-nocookie.com domain, and only after you press play. The map on our About
          page loads its tiles from OpenStreetMap. Those services receive your IP address when their content loads and
          handle it under their own policies.
        </p>

        <h3>3.3 Business transfers</h3>
        <p>
          If we or our assets are acquired, or if we go out of business, enter bankruptcy or go through some other
          change of control, personal information could be one of the assets transferred to or acquired by a third
          party.
        </p>

        <h3>3.4 Legal compliance</h3>
        <p>
          We may access, preserve and disclose information that we believe is necessary to comply with the law, a court
          order or a government request, or to enforce our <Link href="/terms">Terms of Use</Link> and other agreements.
        </p>

        <h2>4. Security</h2>
        <p>
          The Site is served over encrypted connections, and access to form submissions and customer records is limited
          to our team. We cannot guarantee that these precautions will always work, or that your personal information
          will never be accessed, disclosed, altered or destroyed by a breach of them. If a breach affects your
          personal information, we will notify you as the law requires.
        </p>
        <p>
          We and our service providers store and process your information in the United States. If you use the Site
          from another country, your information will be transferred to the United States.
        </p>

        <h2>5. Access, deletion and retention</h2>
        <p>
          To see, correct or delete the personal information we hold about you, email {mail}. We may ask you to confirm
          the request from the email address you gave us. We will respond within 30 days, and we will delete your
          information from our database, customer records and analytics unless the law requires us to keep it. We
          honor these requests no matter where you live. We cannot recall a
          perusal score you have already downloaded. To stop hearing from us, reply to any of our emails or write to
          the same address.
        </p>
        <p>
          Session recordings are deleted after 30 days. Other analytics data is kept for as long as our PostHog plan
          retains it. We have no set schedule for deleting form submissions, score requests or customer records, so we
          keep them until you ask us to delete them.
        </p>

        <h2>6. How we respond to Do Not Track signals</h2>
        <p>
          The Site does not respond to “Do Not Track” or Global Privacy Control signals. To keep your visits out of our
          analytics, block cookies and scripts for brightdesigns.band or use a browser or extension that blocks
          trackers. The Site works without them.
        </p>

        <h2>7. Children</h2>
        <p>
          The Site is meant for band directors, staff and students who are at least 13 years old. If you are under 18,
          please get permission from a parent, guardian or your band director before you send us a form. We do not
          knowingly collect personal information from children under 13. If you think a child under 13 has sent us
          information, email {mail} and we will delete it.
        </p>

        <h2>8. Changes to this Policy</h2>
        <p>
          We may change this Policy from time to time. The date of the last change is posted at the top. Please check
          back for updates. By continuing to use the Site after a change, you agree to the updated Policy.
        </p>

        <h2>9. Contact us</h2>
        <p>If you have questions or concerns about this Policy, write to us and we will try to resolve them.</p>
        <p>
          {LEGAL_ENTITY}
          <br />
          {mail}
        </p>
      </div>
    </div>
  )
}
