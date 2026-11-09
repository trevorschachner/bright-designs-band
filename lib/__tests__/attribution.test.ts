import { describe, expect, it } from 'vitest'
import { campaignLabel, posthogPersonUrl, referrerDomain, webChannel } from '../attribution'

describe('webChannel', () => {
  it.each([
    [{}, 'Direct'],
    [{ referrer: 'https://www.google.com/' }, 'Search'],
    [{ referrer: 'https://duckduckgo.com/' }, 'Search'],
    [{ referrer: 'https://l.facebook.com/l.php' }, 'Social'],
    [{ referrer: 'https://www.instagram.com/' }, 'Social'],
    [{ referrer: 'https://t.co/abc' }, 'Social'],
    [{ referrer: 'https://youtu.be/xyz' }, 'Social'],
    [{ referrer: 'https://mail.google.com/mail/u/0/' }, 'Email'],
    [{ referrer: 'https://bandmasters-forum.org/thread/1' }, 'Referral site'],
    [{ utmSource: 'newsletter', utmMedium: 'email' }, 'Email'],
    [{ utmSource: 'google', utmMedium: 'cpc' }, 'Paid'],
    [{ utmSource: 'facebook', utmMedium: 'paid_social' }, 'Paid'],
    [{ utmSource: 'instagram' }, 'Social'],
    [{ utmSource: 'midwest-clinic', utmCampaign: 'booth-qr' }, 'Campaign'],
    // UTM tags win over the referrer they arrived through.
    [{ referrer: 'https://www.google.com/', utmMedium: 'email' }, 'Email'],
  ])('%j → %s', (touch, channel) => {
    expect(webChannel(touch)).toBe(channel)
  })
})

describe('referrerDomain / campaignLabel / posthogPersonUrl', () => {
  it('strips www and mobile prefixes and ignores garbage', () => {
    expect(referrerDomain('https://www.Google.com/search?q=x')).toBe('google.com')
    expect(referrerDomain('https://m.facebook.com/')).toBe('facebook.com')
    expect(referrerDomain('not a url')).toBeUndefined()
    expect(referrerDomain(undefined)).toBeUndefined()
  })
  it('joins the UTM tags it has', () => {
    expect(campaignLabel({ utmSource: 'facebook', utmCampaign: 'spring-2027' })).toBe('facebook / spring-2027')
    expect(campaignLabel({ referrer: 'https://google.com/' })).toBeUndefined()
  })
  it('links the PostHog person page, encoding the id', () => {
    expect(posthogPersonUrl('0190-abc')).toBe('https://us.posthog.com/project/261511/person/0190-abc')
    expect(posthogPersonUrl(undefined)).toBeUndefined()
  })
})
