import { ContactFormData } from './types';
import { FREE_SHOW_DEADLINE_LABEL, FREE_SHOW_PATH, FREE_SHOW_PUBLIC_NAME } from '@/lib/free-show';

const SITE_URL = 'https://brightdesigns.band';
// Email-sized copies in public/email/: small files at 3x the displayed size,
// so they stay sharp on retina screens without slowing the email down.
export const EMAIL_ASSET_BASE = `${SITE_URL}/email`;
export const LOGO_URL = `${EMAIL_ASSET_BASE}/logo.png`;
export const CONTACT_ADDRESS = 'hello@brightdesigns.band';

// Minimal HTML escaper to prevent XSS in email HTML templates
function escapeHtmlText(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Email-safe brand colors (solid hex only; many clients drop rgba)
const colors = {
  midnight: '#1A244D',
  electric: '#FFD230',
  sky: '#45D4FF',
  skyDark: '#0B7FA6', // sky darkened so links pass contrast on white
  white: '#FFFFFF',
  charcoal: '#242323',
  slate: '#5B6474',
  line: '#E6E8EE',
  canvas: '#F3F4F7',
  lightBlue: '#EAF8FD',
  lightYellow: '#FFF8E0',
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const OWNERS = [
  { name: 'Trevor', photo: `${EMAIL_ASSET_BASE}/trevor.jpg` },
  { name: 'Brighton', photo: `${EMAIL_ASSET_BASE}/brighton.jpg` },
  { name: 'Ryan', photo: `${EMAIL_ASSET_BASE}/ryan.jpg` },
];
const OWNER_NAMES = 'Trevor, Brighton & Ryan';

// From the homepage and about page. Keep in step with the site.
const TRACK_RECORD = 'Designing marching band shows since 2017, with 100+ shows performed nationwide.';

const SERVICE_LABELS: Record<string, string> = {
  'existing-show-purchase': 'Purchase Existing Show',
  'custom-show-creation': 'Custom Show Creation',
  'music-arranging': 'Music Arranging',
  'music-licensing': 'Music Licensing',
  'drill-design': 'Drill Design',
  'choreography': 'Choreography',
  'visual-design': 'Visual Design',
  'costume-consultation': 'Costume Consultation',
  'show-consultation': 'Show Consultation',
  'rehearsal-support': 'Rehearsal Support',
  'audio-production': 'Audio Production',
  'video-production': 'Video Production',
  'collaboration': 'Collaboration',
  'other': 'Other',
  'wind-arranging': 'Custom Wind Arranging',
  'program-coordination': 'Full Program Coordination',
  'drill': 'Drill and Visual Design',
  'copyright': 'Copyright Acquisition',
  'percussion': 'Percussion Writing/Right-Sizing',
  'solos': 'Solo Adjustments',
  'visual-technique-guide': 'Visual Technique Guide Request',
};

const REFERRAL_LABELS: Record<string, string> = {
  'band-director': 'Another Band Director',
  'word-of-mouth': 'Word of Mouth',
  'google': 'Google',
  'instagram': 'Instagram',
  'facebook': 'Facebook',
  'youtube': 'YouTube',
  'tiktok': 'TikTok',
  'conference': 'Conference/Workshop',
  'other': 'Other',
};

const ABILITY_LEVEL_LABELS: Record<string, string> = {
  '1-2': 'Grades 1-2',
  '3-4': 'Grades 3-4',
  '5-6+': 'Grades 5-6+',
};

const additionalNotesLabel = 'Additional Notes or Questions';

const getInquiryLabel = (data: ContactFormData) =>
  data?.source === 'check-availability' ? 'Show of Interest' : 'Inquiry Topic';

const submittedAt = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

/** Text an inbox shows next to the subject. Hidden in the opened email. */
const preheader = (text: string) => `
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${colors.canvas};opacity:0;">${escapeHtmlText(text)}${'&#8199;&#65279;&#847;'.repeat(60)}</div>`;

/**
 * The shared shell: a 600px card on a grey canvas, logo on top, footer
 * under the card. Built from tables with inline styles so Outlook and
 * Gmail render it the same way; the <style> block only adds the phone
 * layout for clients that support it.
 */
function layout(opts: { title: string; preheader: string; body: string; footer: string }): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtmlText(opts.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .bd-card { padding: 28px 22px 30px !important; }
      .bd-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .bd-h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${colors.canvas};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div role="article" aria-roledescription="email" aria-label="${escapeHtmlText(opts.title)}" lang="en" style="background-color:${colors.canvas};">${preheader(opts.preheader)}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.canvas};">
    <tr>
      <td align="center" style="padding:32px 12px 40px;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;">
          <tr>
            <td style="background-color:${colors.electric};height:6px;line-height:6px;font-size:0;border-radius:14px 14px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="bd-card" style="background-color:${colors.white};border-radius:0 0 14px 14px;padding:36px 40px 40px;">
              <a href="${SITE_URL}" style="display:inline-block;"><img src="${LOGO_URL}" alt="Bright Designs" width="120" height="63" style="display:block;width:120px;height:auto;border:0;outline:none;"></a>
              <div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td class="bd-pad" style="padding:22px 40px 0;font-size:12px;line-height:1.7;color:${colors.slate};text-align:center;">
              ${opts.footer}
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
  </div>
</body>
</html>`;
}

/** A pill button that also renders in Outlook for Windows, which ignores padding on links. */
const button = (label: string, href: string, opts: { width?: number } = {}) => {
  const width = opts.width ?? Math.max(180, label.length * 9 + 56);
  return `
              <div style="margin:28px 0 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="50%" stroke="f" fillcolor="${colors.midnight}">
                  <center style="color:${colors.white};font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- --><a href="${href}" style="display:inline-block;background-color:${colors.midnight};color:${colors.white};font-size:15px;font-weight:700;line-height:20px;padding:13px 28px;border-radius:999px;text-decoration:none;">${label}</a><!--<![endif]-->
              </div>`;
};

const link = (label: string, href: string) =>
  `<a href="${href}" style="color:${colors.skyDark};text-decoration:none;">${label}</a>`;

const para = (html: string, opts: { top?: number; size?: number; color?: string } = {}) =>
  `<p style="margin:${opts.top ?? 16}px 0 0;font-size:${opts.size ?? 16}px;line-height:1.6;color:${opts.color ?? colors.charcoal};">${html}</p>`;

const eyebrow = (text: string, top = 32) =>
  `<p style="margin:${top}px 0 14px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${colors.slate};">${escapeHtmlText(text)}</p>`;

// ---------------------------------------------------------------------------
// Staff notification
// ---------------------------------------------------------------------------

/** One row in a section. `value` must already be escaped; an empty label shows the value alone. */
const field = (label: string, value: string, opts: { pre?: boolean } = {}) => `
                <tr>
                  <td style="padding:12px 0;border-top:1px solid ${colors.line};">
                    ${label ? `<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${colors.slate};">${escapeHtmlText(label)}</p>` : ''}
                    <div style="font-size:15px;line-height:1.5;color:${colors.charcoal};${opts.pre ? 'white-space:pre-wrap;' : ''}word-break:break-word;">${value}</div>
                  </td>
                </tr>`;

const section = (heading: string, rows: string) => `
              <p style="margin:28px 0 4px;font-size:13px;font-weight:700;color:${colors.midnight};">${escapeHtmlText(heading)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}
              </table>`;

export function generateContactEmailTemplate(data: ContactFormData): { html: string; text: string } {
  const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
  const selectedServices = data.services.map(s => SERVICE_LABELS[s] || s).join(', ');
  const referral = data.referralSource
    ? REFERRAL_LABELS[data.referralSource] ?? data.referralSource
    : '';
  const ability = data.abilityLevel ? ABILITY_LEVEL_LABELS[data.abilityLevel] ?? data.abilityLevel : '';
  const bandSize = data.bandSize ? `${data.bandSize} members` : '';
  const when = submittedAt();

  const contactRows = [
    field('Name', escapeHtmlText(fullName)),
    field('Email', link(escapeHtmlText(data.email), `mailto:${encodeURIComponent(data.email || '')}`)),
    data.phone ? field('Phone', link(escapeHtmlText(data.phone), `tel:${encodeURIComponent(data.phone)}`)) : '',
    data.school ? field('School or Organization', escapeHtmlText(data.school)) : '',
    referral
      ? field(
          'How they heard about us',
          escapeHtmlText(referral) +
            (data.referralBandDirector
              ? `<br><span style="font-size:13px;color:${colors.slate};">Referred by ${escapeHtmlText(data.referralBandDirector)}</span>`
              : ''),
        )
      : '',
    data.pageUrl || data.referrerUrl
      ? field(
          'Sent from',
          escapeHtmlText(data.pageUrl || '(unknown page)') +
            (data.referrerUrl
              ? `<br><span style="font-size:13px;color:${colors.slate};">Came from ${escapeHtmlText(data.referrerUrl)}</span>`
              : ''),
        )
      : '',
  ].join('');

  const ensembleRows = [
    bandSize ? field('Band Size', escapeHtmlText(bandSize)) : '',
    ability ? field('Ability Level', escapeHtmlText(ability)) : '',
    data.instrumentation ? field(additionalNotesLabel, escapeHtmlText(data.instrumentation), { pre: true }) : '',
  ].join('');

  const replyHref = `mailto:${encodeURIComponent(data.email || '')}`;

  const body = `
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${colors.skyDark};">New submission</p>
              <h1 class="bd-h1" style="margin:0;font-size:26px;line-height:1.3;font-weight:700;color:${colors.midnight};">${escapeHtmlText(fullName || 'Someone')} got in touch</h1>
              ${data.showInterest ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;">
                <tr>
                  <td style="background-color:${colors.lightBlue};border-left:4px solid ${colors.sky};border-radius:6px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${colors.slate};">${getInquiryLabel(data)}</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:${colors.midnight};">${escapeHtmlText(data.showInterest)}</p>
                  </td>
                </tr>
              </table>` : ''}
              ${data.message ? section('Message', field('', escapeHtmlText(data.message), { pre: true })) : ''}
              ${section('Contact', contactRows)}
              ${ensembleRows ? section('Ensemble', ensembleRows) : ''}
              ${selectedServices ? section('Services', field('', escapeHtmlText(selectedServices))) : ''}
              ${button(`Reply to ${escapeHtmlText(data.firstName || 'them')}`, replyHref)}
              ${para('Or just reply to this email.', { size: 13, color: colors.slate })}`;

  const html = layout({
    title: 'New contact form submission',
    preheader: `${fullName || 'Someone'}${data.showInterest ? ` · ${data.showInterest}` : ''}`,
    body,
    footer: `Submitted ${escapeHtmlText(when)}`,
  });

  const lines = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join('\n');
  const text = lines(
    'NEW CONTACT FORM SUBMISSION - Bright Designs\n',
    data.showInterest && `${getInquiryLabel(data).toUpperCase()}\n${data.showInterest}\n`,
    data.message && `MESSAGE\n${data.message}\n`,
    'CONTACT',
    `Name: ${fullName}`,
    `Email: ${data.email}`,
    data.phone && `Phone: ${data.phone}`,
    data.school && `School/Organization: ${data.school}`,
    referral && `How did you hear about us?: ${referral}${data.referralBandDirector ? ` (Referred by: ${data.referralBandDirector})` : ''}`,
    data.pageUrl && `Sent from: ${data.pageUrl}`,
    data.referrerUrl && `Came from: ${data.referrerUrl}`,
    !!ensembleRows && '\nENSEMBLE',
    bandSize && `Band Size: ${bandSize}`,
    ability && `Ability Level: ${ability}`,
    data.instrumentation && `${additionalNotesLabel}:\n${data.instrumentation}`,
    selectedServices && `\nSERVICES\n${selectedServices}`,
    '\n---',
    `Submitted: ${when}`,
    'Reply to this email to answer them directly.',
  );

  return { html, text };
}

// ---------------------------------------------------------------------------
// Customer confirmation
// ---------------------------------------------------------------------------

/** Which kind of submission a confirmation acknowledges. */
export type ConfirmationKind = 'inquiry' | 'contact' | 'resource_download' | 'free_show_signup';

/**
 * Everything a confirmation says. All of it is our own fixed copy and may
 * hold our own markup; none of it is ever submitter text.
 */
interface ConfirmationCopy {
  /** Heading; receives the cleaned first name, or null when there is none. */
  heading: (firstName: string | null) => string;
  intro: string;
  /** Optional highlighted panel under the intro. */
  panel?: { label: string; html: string };
  stepsLabel?: string;
  steps?: string[];
  cta: { label: string; href: string };
  closing: string;
}

// Fixed phrases: the confirmation never names the topic the submitter typed.
const CONFIRMATION_COPY: Record<ConfirmationKind, ConfirmationCopy> = {
  inquiry: {
    heading: name => (name ? `Thanks for reaching out, ${name}!` : 'Thanks for reaching out!'),
    intro: "We've received your show inquiry, and we're looking forward to learning about your group!",
    stepsLabel: 'How it works from here',
    steps: [
      'One of us replies within <strong>24 hours</strong> on business days.',
      'We set up a call about your group and your goals.',
      'We share concepts and drafts, then revise them with your feedback.',
    ],
    cta: { label: 'Browse our shows', href: `${SITE_URL}/shows` },
    closing: 'If you think of anything else, just reply to this email!',
  },
  contact: {
    heading: name => (name ? `Thanks for the message, ${name}!` : 'Thanks for the message!'),
    intro: "We've received your message, and one of us will reply within 24 hours on business days.",
    cta: { label: 'Browse our shows', href: `${SITE_URL}/shows` },
    closing: 'If you think of anything else, just reply to this email!',
  },
  resource_download: {
    heading: name => (name ? `Thanks, ${name}!` : 'Thanks!'),
    intro: "We've received your guide request, and one of us will send it within 24 hours on business days.",
    cta: { label: 'Browse our shows', href: `${SITE_URL}/shows` },
    closing: 'If you have questions in the meantime, just reply to this email!',
  },
  // A giveaway entry gets no reply, so it never promises one.
  free_show_signup: {
    heading: name => (name ? `You're entered, ${name}!` : "You're entered!"),
    intro: `We've received your ${FREE_SHOW_PUBLIC_NAME} entry. Thanks for telling us about your group!`,
    panel: {
      label: 'The prize',
      html: 'One custom 2027 indoor winds show: wind music and drill written for the winning group, plus the copyright costs for that music.',
    },
    stepsLabel: 'What happens next',
    steps: [
      `Entries close <strong>${FREE_SHOW_DEADLINE_LABEL}</strong>.`,
      'We draw one group at random after entries close.',
      "If your group wins, we'll email you at this address.",
    ],
    cta: { label: 'See the giveaway', href: `${SITE_URL}${FREE_SHOW_PATH}` },
    closing: 'Know another director who should enter? Send them the giveaway page! You can also reply to this email with any questions.',
  },
};

/**
 * The submitter's first name reduced to letters, spaces, apostrophes and
 * hyphens, so no URL, address or markup can survive into the greeting.
 */
const confirmationFirstName = (value: string | undefined): string | null => {
  const cleaned = (value ?? '')
    .replace(/[^\p{L}\p{M}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
    .trim();
  return /\p{L}/u.test(cleaned) ? cleaned : null;
};

const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');

/** The three owners' photos and names, so the email reads as from people. */
const signature = () => `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                <tr>
                  ${OWNERS.map(
                    (o, i) => `<td style="padding:0 ${i < OWNERS.length - 1 ? 8 : 0}px 0 0;"><img src="${o.photo}" alt="${o.name}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:24px;border:0;"></td>`,
                  ).join('')}
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.4;color:${colors.midnight};"><strong>${OWNER_NAMES}</strong></p>
              <p style="margin:2px 0 0;font-size:13px;line-height:1.4;color:${colors.slate};">Owners, Bright Designs</p>`;

export function generateCustomerConfirmationTemplate(
  data: ContactFormData,
  kind: ConfirmationKind = 'contact'
): { html: string; text: string } {
  // This email goes to whatever address was submitted, so it must not carry
  // the submitter's free text: echoing the message, topic, notes, school or
  // referral fields would turn the form into a relay for arbitrary content
  // sent from our domain. The only submitter-derived text is a first name
  // stripped to letters; every other phrase and service label is fixed, and
  // unknown service values are dropped rather than echoed.
  const copy = CONFIRMATION_COPY[kind];
  // "Other" tells the submitter nothing, so it is left off.
  const selectedServices = data.services
    .filter(s => s !== 'other')
    .map(s => SERVICE_LABELS[s])
    .filter(Boolean)
    .join(', ');
  const name = confirmationFirstName(data.firstName);
  const heading = copy.heading(name);

  const steps = (copy.steps ?? [])
    .map(
      (step, i) => `
                <tr>
                  <td width="40" valign="top" style="padding:0 0 14px;">
                    <div style="width:26px;height:26px;line-height:26px;border-radius:13px;background-color:${colors.electric};color:${colors.midnight};font-size:13px;font-weight:700;text-align:center;">${i + 1}</div>
                  </td>
                  <td valign="top" style="padding:3px 0 14px;font-size:15px;line-height:1.5;color:${colors.charcoal};">${step}</td>
                </tr>`,
    )
    .join('');

  const panel = copy.panel
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;">
                <tr>
                  <td style="background-color:${colors.lightYellow};border-left:4px solid ${colors.electric};border-radius:6px;padding:16px 18px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${colors.slate};">${escapeHtmlText(copy.panel.label)}</p>
                    <p style="margin:0;font-size:15px;line-height:1.55;color:${colors.midnight};">${copy.panel.html}</p>
                  </td>
                </tr>
              </table>`
    : '';

  const body = `
              <h1 class="bd-h1" style="margin:0;font-size:28px;line-height:1.25;font-weight:700;color:${colors.midnight};">${escapeHtmlText(heading)}</h1>
              ${para(copy.intro)}
              ${selectedServices ? para(`You asked about: ${escapeHtmlText(selectedServices)}`, { top: 12, size: 14, color: colors.slate }) : ''}
              ${panel}
              ${steps ? `${eyebrow(copy.stepsLabel ?? 'What happens next')}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${steps}
              </table>` : ''}
              ${button(copy.cta.label, copy.cta.href)}
              ${para(copy.closing, { top: 28 })}
              ${para('Thanks!', { top: 16 })}
              ${signature()}`;

  const html = layout({
    title: heading,
    preheader: stripTags(copy.intro),
    body,
    footer: `${TRACK_RECORD}<br>${link('brightdesigns.band', SITE_URL)} &nbsp;·&nbsp; ${link(CONTACT_ADDRESS, `mailto:${CONTACT_ADDRESS}`)}<br>You're getting this because you filled out a form on our website.`,
  });

  const text = [
    `Hi ${name ?? 'there'},`,
    '',
    stripTags(copy.intro),
    ...(selectedServices ? ['', `You asked about: ${selectedServices}`] : []),
    ...(copy.panel ? ['', `${copy.panel.label}: ${stripTags(copy.panel.html)}`] : []),
    ...(copy.steps
      ? ['', `${copy.stepsLabel ?? 'What happens next'}:`, ...copy.steps.map((s, i) => `${i + 1}. ${stripTags(s)}`)]
      : []),
    '',
    `${copy.cta.label}: ${copy.cta.href}`,
    '',
    copy.closing,
    '',
    'Thanks!',
    OWNER_NAMES,
    'Owners, Bright Designs',
    '',
    '---',
    TRACK_RECORD,
    SITE_URL,
    CONTACT_ADDRESS,
  ].join('\n');

  return { html, text };
}
