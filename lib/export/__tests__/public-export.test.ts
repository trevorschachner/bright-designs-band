import { describe, expect, it } from 'vitest'
import { EXPORT_FILES, publicExportCsv } from '../public-export'
import type { ShowSheetTables } from '../load-show-sheet'
import { showRow } from '../show-sheet'

const tables = {
  shows: [{ id: 1, title: 'Apex', featured: false }],
  parts: [{ id: 7, show: 'Apex', part: 1, title: 'Intruder' }],
  pieces: [{ id: 3, title: 'Libertango', composer: 'Astor Piazzolla', copyright_amount_usd: '250.00', licensing_status: 'NYA' }],
  links: [{ show_id: 1, arrangement_id: 7, order_index: 1 }],
} as unknown as ShowSheetTables

describe('publicExportCsv', () => {
  it('fills ensemble_size and includes and ends shows.csv with a quoted program_notes', () => {
    const csv = publicExportCsv('shows.csv', {
      ...tables,
      shows: [showRow({
        id: 1, title: 'Apex', slug: 'apex', description: null, duration: null, difficulty: null,
        thumbnailUrl: null, graphicUrl: null, youtubeUrl: null, videoUrl: null, year: 2026,
        commissioned: null, programCoordinator: null, percussionArranger: null, soundDesigner: null,
        windArranger: null, drillWriter: null, featured: false, displayOrder: 0, tagNames: [],
        ensembleSize: 'medium', includes: 'winds, percussion', programNotes: 'Line one.\n\n- Part 1, "opener"',
      })],
    } as unknown as ShowSheetTables)!
    const [header] = csv.split('\r\n')
    expect(header.endsWith(',program_notes')).toBe(true)
    expect(csv).toContain('medium,"winds, percussion"')
    expect(csv).toContain('"Line one.\n\n- Part 1, ""opener"""')
  })

  it('serves the four sheet files', () => {
    expect(EXPORT_FILES).toEqual(['shows.csv', 'parts.csv', 'pieces.csv', 'links.csv'])
    for (const f of EXPORT_FILES) expect(publicExportCsv(f, tables)).toMatch(/^id,|^show_id,/)
  })

  it('never exposes copyright cost or licensing status', () => {
    const csv = publicExportCsv('pieces.csv', tables)!
    expect(csv.split('\r\n')[0]).toBe('id,title,composer')
    expect(csv).toContain('3,Libertango,Astor Piazzolla')
    expect(csv).not.toMatch(/250|NYA|copyright|licensing/)
  })

  it('returns null for anything else', () => {
    expect(publicExportCsv('secrets.csv', tables)).toBeNull()
    expect(publicExportCsv('shows', tables)).toBeNull()
  })
})
