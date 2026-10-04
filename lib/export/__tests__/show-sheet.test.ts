import { describe, expect, it } from 'vitest'
import {
  PART_COLUMNS,
  PIECE_COLUMNS,
  SHOW_COLUMNS,
  csvCell,
  partRow,
  pieceRow,
  publicFileUrl,
  showRow,
  toCsv,
  type PartRecord,
  type ShowRecord,
} from '../show-sheet'

// These orders are the contract with the "Show Database" sheet (#51). A
// reorder here silently misaligns every paste, so it has to be deliberate.
describe('column order matches the sheet', () => {
  it('shows', () => {
    expect([...SHOW_COLUMNS]).toEqual([
      'id', 'title', 'slug', 'description', 'duration', 'difficulty', 'thumbnail_url', 'graphic_url',
      'youtube_url', 'video_url', 'year', 'commissioned', 'program_coordinator', 'percussion_arranger',
      'sound_designer', 'wind_arranger', 'drill_writer', 'ensemble_size', 'includes', 'tags', 'featured',
      'display_order',
    ])
  })

  it('parts', () => {
    expect([...PART_COLUMNS]).toEqual([
      'id', 'show', 'part', 'title', 'scene', 'duration_seconds', 'grade', 'ensemble_size', 'arranger',
      'percussion_arranger', 'year', 'commissioned', 'youtube_url', 'sample_score_url', 'audio', 'pieces',
    ])
  })

  it('pieces', () => {
    expect([...PIECE_COLUMNS]).toEqual(['id', 'title', 'composer', 'copyright_amount_usd', 'licensing_status'])
  })
})

const show: ShowRecord = {
  id: 7, title: 'Gold Rush', slug: 'gold-rush', description: 'Dreamers, heading west', duration: '7:30',
  difficulty: 'Intermediate', thumbnailUrl: null, graphicUrl: 'https://x/g.webp', youtubeUrl: null,
  videoUrl: null, year: 2023, commissioned: 'Travelers Rest HS', programCoordinator: null,
  percussionArranger: null, soundDesigner: null, windArranger: null, drillWriter: null, featured: true,
  displayOrder: 2, tagNames: ['Energetic', 'Cinematic'],
}

const part: PartRecord = {
  id: 17, showTitle: 'Gold Rush', orderIndex: 1, title: 'Gold Rush + American Faces', scene: 'Opener',
  durationSeconds: 166, grade: '3_4', ensembleSize: 'small', arranger: 'A, B', percussionArranger: null,
  year: 2023, commissioned: null, youtubeUrl: null, sampleScoreUrl: null, audioUrl: 'https://x/a.mp3',
  pieceTitles: ['Libertango', 'Redline Tango'],
}

describe('row builders', () => {
  it('fill every column of a show, leaving missing ensemble_size and includes blank', () => {
    const row = showRow(show)
    expect(Object.keys(row)).toEqual([...SHOW_COLUMNS])
    expect(row.ensemble_size).toBeNull()
    expect(row.includes).toBeNull()
    expect(row.tags).toBe('Energetic, Cinematic')
  })

  it('fill every column of a part, with pieces as an ordered comma list', () => {
    const row = partRow(part)
    expect(Object.keys(row)).toEqual([...PART_COLUMNS])
    expect(row.part).toBe(1)
    expect(row.pieces).toBe('Libertango, Redline Tango')
  })

  it('fill every column of a piece', () => {
    const row = pieceRow({ id: 1, title: 'Libertango', composer: 'Piazzolla', copyrightAmountUsd: '250.00', licensingStatus: 'NYA' })
    expect(Object.keys(row)).toEqual([...PIECE_COLUMNS])
  })
})

describe('csv encoding', () => {
  it('quotes commas, quotes, newlines and edge whitespace', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a, b')).toBe('"a, b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"')
    expect(csvCell('True Colors ')).toBe('"True Colors "')
  })

  it('writes null as empty and booleans as Sheets booleans', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(true)).toBe('TRUE')
    expect(csvCell(false)).toBe('FALSE')
    expect(csvCell(0)).toBe('0')
  })

  it('emits the header then one line per row in column order', () => {
    const csv = toCsv(PART_COLUMNS, [partRow(part)])
    const [header, line] = csv.trimEnd().split('\r\n')
    expect(header).toBe(PART_COLUMNS.join(','))
    expect(line.startsWith('17,Gold Rush,1,Gold Rush + American Faces,Opener,166,3_4,small,"A, B",')).toBe(true)
    expect(line.endsWith(',https://x/a.mp3,"Libertango, Redline Tango"')).toBe(true)
  })
})

describe('publicFileUrl', () => {
  const opts = { supabaseUrl: 'https://p.supabase.co/', bucket: 'Bright Designs', rootPrefix: 'files' }

  it('passes absolute URLs through', () => {
    expect(publicFileUrl('https://cdn/x.mp3', opts)).toBe('https://cdn/x.mp3')
  })

  it('resolves a storage path under the bucket and root prefix', () => {
    expect(publicFileUrl('/shows/1/a.mp3', opts)).toBe(
      'https://p.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/1/a.mp3'
    )
  })

  it('returns null without a value or a base URL', () => {
    expect(publicFileUrl(null, opts)).toBeNull()
    expect(publicFileUrl('shows/1/a.mp3', { ...opts, supabaseUrl: undefined })).toBeNull()
  })
})
