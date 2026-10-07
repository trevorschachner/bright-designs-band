/**
 * The public CSVs at /api/export/<file>. The "Active Assets on Website" sheet
 * pulls each one into a tab with =IMPORTDATA(...), so the sheet mirrors the
 * site with nothing to run or authenticate.
 *
 * Public, like the rest of the site, so only what the site already shows:
 * pieces lose copyright cost and licensing status. Those stay in /admin and
 * `npm run export:shows`.
 */
import { PART_COLUMNS, SHOW_COLUMNS, toCsv } from './show-sheet'
import { LINK_COLUMNS, type ShowSheetTables } from './load-show-sheet'

export const PUBLIC_PIECE_COLUMNS = ['id', 'title', 'composer'] as const

export const EXPORT_FILES = ['shows.csv', 'parts.csv', 'pieces.csv', 'links.csv'] as const
export type ExportFile = (typeof EXPORT_FILES)[number]

export function publicExportCsv(file: string, tables: ShowSheetTables): string | null {
  switch (file) {
    case 'shows.csv':
      return toCsv(SHOW_COLUMNS, tables.shows)
    case 'parts.csv':
      return toCsv(PART_COLUMNS, tables.parts)
    case 'pieces.csv':
      return toCsv(
        PUBLIC_PIECE_COLUMNS,
        tables.pieces.map(p => ({ id: p.id, title: p.title, composer: p.composer }))
      )
    case 'links.csv':
      return toCsv(LINK_COLUMNS, tables.links)
    default:
      return null
  }
}
