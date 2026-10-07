/**
 * Minimal Google Sheets client for `npm run sync:sheet`: service-account login
 * and whole-tab rewrites. Plain fetch + node:crypto, so no Google SDK.
 */
import { createSign } from 'crypto'
import type { Row } from './show-sheet'

export type ServiceAccount = { client_email: string; private_key: string }
export type SheetValue = string | number | boolean

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://sheets.googleapis.com/v4/spreadsheets'

/** Header row, then one row per record in column order. Blanks for null. */
export function toSheetValues<C extends readonly string[]>(columns: C, rows: readonly Row<C>[]): SheetValue[][] {
  return [
    [...columns],
    ...rows.map(row => columns.map(c => row[c as C[number]] ?? '') as SheetValue[]),
  ]
}

/** A1 range for a tab, quoted so names with spaces or apostrophes work. */
export function sheetRange(tab: string, cells?: string): string {
  const quoted = `'${tab.replace(/'/g, "''")}'`
  return cells ? `${quoted}!${cells}` : quoted
}

/** Signed JWT the token endpoint swaps for an access token (valid one hour). */
export function serviceAccountAssertion(sa: ServiceAccount, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url')
  return `${unsigned}.${signature}`
}

async function call<T>(url: string, init: RequestInit & { token: string }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${init.token}`, 'content-type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${(await res.text()).slice(0, 500)}`)
  return (await res.json()) as T
}

export async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: serviceAccountAssertion(sa),
    }),
  })
  if (!res.ok) throw new Error(`Google token request failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return ((await res.json()) as { access_token: string }).access_token
}

/**
 * Replace the full contents of each named tab, creating missing tabs. Values
 * are written RAW so a title that starts with "=" stays text, never a formula.
 */
export async function replaceTabs(
  token: string,
  spreadsheetId: string,
  tabs: { title: string; values: SheetValue[][] }[]
): Promise<void> {
  const meta = await call<{ sheets: { properties: { title: string } }[] }>(
    `${API}/${spreadsheetId}?fields=sheets.properties.title`,
    { token }
  )
  const existing = new Set(meta.sheets.map(s => s.properties.title))
  const missing = tabs.filter(t => !existing.has(t.title))
  if (missing.length > 0) {
    await call(`${API}/${spreadsheetId}:batchUpdate`, {
      token,
      method: 'POST',
      body: JSON.stringify({ requests: missing.map(t => ({ addSheet: { properties: { title: t.title } } })) }),
    })
  }

  await call(`${API}/${spreadsheetId}/values:batchClear`, {
    token,
    method: 'POST',
    body: JSON.stringify({ ranges: tabs.map(t => sheetRange(t.title)) }),
  })
  await call(`${API}/${spreadsheetId}/values:batchUpdate`, {
    token,
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: tabs.map(t => ({ range: sheetRange(t.title, 'A1'), values: t.values })),
    }),
  })
}
