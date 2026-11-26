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

// Every claim here is checked against the code (see the PR for issue #100).
// When the site starts collecting something new, update this page and
// LEGAL_LAST_UPDATED in lib/content/legal.ts.
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
          This policy explains what {LEGAL_ENTITY} (“Bright Designs”, “we”) collects through brightdesigns.band, why we
          collect it, who handles it for us, and what you can do about it. Questions go to {mail}.
        </p>

        <h2>What you give us</h2>
        <ul>
          <li>
            <strong>Inquiry and contact forms:</strong> your name, email, school or organization, band size, ability
            level, the services and show you’re asking about, your notes, how you heard about us and who referred you.
          </li>
          <li>
            <strong>Free guide requests:</strong> your name, email, school or organization, and role.
          </li>
          <li>
            <strong>Free show entries:</strong> your name, email, role, group or school, location, group size, your
            answers about your program, and whether you’ve worked with a design group before.
          </li>
          <li>
            <strong>Perusal score requests:</strong> your name, email, school or program, and role.
          </li>
          <li>
            <strong>Email:</strong> anything you send us directly.
          </li>
        </ul>

        <h2>What we collect automatically</h2>
        <ul>
          <li>
            <strong>With every form:</strong> your IP address, your browser’s user agent, the page you sent the form
            from and the page before it, and how you first found the site (the referring site, the first page you
            landed on, and any campaign tags in that link). We also attach your analytics visitor ID so we can see
            which pages you looked at before you got in touch.
          </li>
          <li>
            <strong>Analytics:</strong> we use PostHog to record the pages you view, what you click, the audio previews
            you play, the scores you open, the forms you send, errors, your browser and device type, the site that
            referred you, and your approximate location based on your IP address.
          </li>
          <li>
            <strong>Session recordings:</strong> PostHog records about 1 in 4 visits (25%). A recording shows the pages
            as you saw them, with your mouse movement, clicks and scrolling, plus technical logs from your browser.
            Text you type into form fields is masked and not recorded.
          </li>
          <li>
            <strong>Hosting logs:</strong> our hosting provider keeps standard request logs, such as IP addresses and
            pages requested.
          </li>
        </ul>

        <h2>Perusal scores</h2>
        <ul>
          <li>Sending the score request form once unlocks perusal scores in that browser for 30 days.</li>
          <li>
            We record which scores you open and when. You can open up to 15 different scores a day, counted by email
            address and by browser. If you reach the limit, our team gets an email with your name, school, email and
            the scores you opened.
          </li>
          <li>
            Every page of a perusal score is stamped with your name, your school and the date. Anyone who sees the file
            will see that stamp.
          </li>
          <li>
            You’re added to our customer records (in Attio) as a lead, along with the shows and arrangements you
            opened. We may contact you about them.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To answer your inquiry and send you a confirmation email.</li>
          <li>To run the free show program and review entries.</li>
          <li>To give you perusal scores, stamp them, and enforce the daily limit.</li>
          <li>To keep track of the programs we talk to and follow up about our shows and services.</li>
          <li>To see which shows and pages people use, and to fix and improve the site.</li>
          <li>To block spam and abuse.</li>
        </ul>
        <p>
          We don’t sell your personal information, and we don’t use advertising trackers or share your information
          with advertisers.
        </p>

        <h2>Cookies and browser storage</h2>
        <p>We don’t show a cookie banner. Here is everything the site stores in your browser:</p>
        <ul>
          <li>
            <strong>PostHog analytics:</strong> a cookie and a local storage entry holding a random visitor ID and the
            current session, so visits can be counted and linked together. The cookie lasts about a year.
          </li>
          <li>
            <strong>Perusal score pass:</strong> a cookie that remembers you’ve sent the score request form. It lasts
            30 days.
          </li>
          <li>
            <strong>How you found us:</strong> a local storage entry with the referring site, landing page and campaign
            tags from your first visit. It stays until you clear your browser storage. A second entry, which lasts only
            while the tab is open, remembers the page you were on before the current one.
          </li>
          <li>
            <strong>Display preference:</strong> whether you chose grid or list view for shows.
          </li>
          <li>
            <strong>Spam check:</strong> Cloudflare Turnstile runs on pages with a form and may use cookies or similar
            signals to tell people from bots.
          </li>
          <li>
            <strong>Staff sign-in:</strong> sign-in cookies, used only by our team in the admin area.
          </li>
        </ul>
        <p>
          Videos load from YouTube’s privacy-enhanced domain (youtube-nocookie.com) only after you press play. The map on
          our About page loads its tiles from OpenStreetMap. Once loaded, those services handle your data under their
          own policies.
        </p>

        <h2>Who handles your information for us</h2>
        <p>We use these service providers to run the site. Each gets only what it needs to do its job.</p>
        <ul>
          <li>
            <strong>Netlify</strong> hosts the site and runs the code that receives forms.
          </li>
          <li>
            <strong>Supabase</strong> stores our database (form submissions, score requests, show catalog) and files.
          </li>
          <li>
            <strong>PostHog</strong> provides analytics and session recordings, stored in the United States.
          </li>
          <li>
            <strong>Attio</strong> is our customer records system. Inquiries, guide requests and score requests go there.
          </li>
          <li>
            <strong>Resend</strong> sends our emails, including form confirmations and notices to our team.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> checks that forms are sent by people, not bots.
          </li>
        </ul>
        <p>
          We may also share information if the law requires it, to protect our rights or the safety of others, or as
          part of a sale or reorganization of our business.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Session recordings are deleted after 30 days.</li>
          <li>Other analytics data is kept for as long as our PostHog plan retains it.</li>
          <li>
            Form submissions, score requests, customer records and emails are kept for as long as they’re useful to our
            working relationship with you and your program, or until you ask us to delete them.
          </li>
          <li>The perusal score pass expires in your browser after 30 days.</li>
        </ul>

        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Opt out of analytics:</strong> block or clear cookies for brightdesigns.band, or use a browser or
            extension that blocks trackers. The site works without analytics. It does not currently respond to Do Not
            Track or Global Privacy Control signals.
          </li>
          <li>
            <strong>See, correct or delete your information:</strong> email {mail}. We’ll delete what we hold about you
            in our database, customer records and analytics, unless we need to keep something by law. We can’t recall
            perusal score files you already downloaded.
          </li>
          <li>
            <strong>Stop hearing from us:</strong> reply to any email from us or write to {mail} and we’ll stop.
          </li>
        </ul>

        <h2>Children</h2>
        <p>
          The site is meant for band directors, staff and students. We don’t knowingly collect information from
          children under 13. If you think a child under 13 has sent us information, email {mail} and we’ll delete it.
        </p>

        <h2>Security</h2>
        <p>
          We use encrypted connections, limit access to the people on our team who need it, and rely on providers with
          established security practices. No system is perfectly secure, so we can’t guarantee your information will
          never be exposed.
        </p>

        <h2>Changes</h2>
        <p>
          When we change this policy we’ll update the date at the top of this page. Our <Link href="/terms">Terms of
          Use</Link> cover your use of the site and perusal scores.
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
