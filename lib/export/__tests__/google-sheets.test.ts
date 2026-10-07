import { describe, expect, it } from 'vitest'
import { createVerify, generateKeyPairSync } from 'crypto'
import { serviceAccountAssertion, sheetRange, toSheetValues } from '../google-sheets'

describe('toSheetValues', () => {
  it('puts the header first and keeps column order', () => {
    const values = toSheetValues(['id', 'title'] as const, [{ id: 3, title: 'Apex' }])
    expect(values).toEqual([['id', 'title'], [3, 'Apex']])
  })

  it('writes blanks for null/undefined and keeps booleans and numbers typed', () => {
    const values = toSheetValues(['a', 'b', 'c', 'd'] as const, [{ a: null, b: undefined, c: true, d: 0 }])
    expect(values[1]).toEqual(['', '', true, 0])
  })
})

describe('sheetRange', () => {
  it('quotes tab names so spaces and apostrophes work', () => {
    expect(sheetRange('Sync status')).toBe("'Sync status'")
    expect(sheetRange("Trevor's tab", 'A1')).toBe("'Trevor''s tab'!A1")
  })
})

describe('serviceAccountAssertion', () => {
  it('builds an RS256 JWT for the Sheets scope that verifies with the public key', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const jwt = serviceAccountAssertion({ client_email: 'sync@x.iam.gserviceaccount.com', private_key: pem }, 1_000)

    const [h, p, sig] = jwt.split('.')
    const decode = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString())
    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(decode(p)).toEqual({
      iss: 'sync@x.iam.gserviceaccount.com',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_000,
      exp: 4_600,
    })
    const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(sig, 'base64url'))
    expect(ok).toBe(true)
  })
})
