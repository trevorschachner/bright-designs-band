/**
 * Where a visitor originally came from, as recorded on their Attio deal.
 *
 * The browser remembers a visitor's first visit (lib/page-trail.ts) and sends
 * it with the contact form; this file turns that into the deal's "Web
 * channel". First touch, not last: a director who found us on Google in
 * January and typed the URL in March to inquire was won by search.
 *
 * Pure functions, safe on the server and the client.
 */

export const WEB_CHANNELS = ['Search', 'Social', 'Email', 'Paid', 'Referral site', 'Direct', 'Campaign'] as const;
export type WebChannel = (typeof WEB_CHANNELS)[number];

export type FirstTouch = {
  /** External page that sent them, or empty for a typed URL / bookmark. */
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|search\.brave|startpage)\./;
const SOCIAL =
  /(^|\.)(facebook|fb|instagram|t\.co|twitter|x|linkedin|lnkd|tiktok|youtube|youtu|reddit|pinterest|threads|bsky|snapchat)\.|^(t\.co|x\.com|youtu\.be|lnkd\.in)$/;
const EMAIL_HOSTS = /(^|\.)(mail\.google|outlook\.live|outlook\.office|mail\.yahoo)\./;

/** `https://www.google.com/search` → `google.com`; anything unparseable → undefined. */
export function referrerDomain(referrer: string | undefined): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).hostname.replace(/^(www\.|m\.|l\.|lm\.)/, '').toLowerCase() || undefined;
  } catch {
    return undefined;
  }
}

export function webChannel(touch: FirstTouch): WebChannel {
  const medium = touch.utmMedium?.toLowerCase() ?? '';
  const source = touch.utmSource?.toLowerCase() ?? '';
  const host = referrerDomain(touch.referrer) ?? '';

  if (/^(cpc|ppc|paid|paidsearch|paid_social|paidsocial|display|cpm)/.test(medium)) return 'Paid';
  if (medium === 'email' || /newsletter|mailchimp|klaviyo/.test(source) || EMAIL_HOSTS.test(host)) return 'Email';
  if (medium === 'social' || SOCIAL.test(`${source}.`) || SOCIAL.test(host)) return 'Social';
  if (SEARCH.test(`${source}.`) || SEARCH.test(host)) return 'Search';
  if (source || medium || touch.utmCampaign) return 'Campaign';
  if (host) return 'Referral site';
  return 'Direct';
}

/** "facebook / social / spring-2027", skipping empty parts; undefined when there are no UTM tags. */
export function campaignLabel(touch: FirstTouch): string | undefined {
  const parts = [touch.utmSource, touch.utmMedium, touch.utmCampaign].map((p) => p?.trim()).filter(Boolean);
  return parts.length ? parts.join(' / ') : undefined;
}

/** PostHog person page for a distinct id: browsing history and session replays. */
export function posthogPersonUrl(distinctId: string | undefined): string | undefined {
  if (!distinctId) return undefined;
  return `https://us.posthog.com/project/261511/person/${encodeURIComponent(distinctId)}`;
}
