import { describe, expect, it } from 'vitest'
import { createProductSchema } from '../structured-data'

describe('createProductSchema', () => {
  it('never publishes a price: pricing is by conversation', () => {
    const schema = createProductSchema({ name: 'Test Show', url: '/shows/test-show' })
    const json = JSON.stringify(schema)
    expect(schema['@type']).toBe('Product')
    expect(schema).not.toHaveProperty('offers')
    expect(json).not.toMatch(/price/i)
  })

  it('keeps the show identity fields', () => {
    const schema = createProductSchema({
      name: 'Test Show',
      description: 'A show.',
      url: '/shows/test-show',
      imageUrl: 'https://img.example/x.png',
    })
    expect(schema).toMatchObject({
      name: 'Test Show',
      description: 'A show.',
      url: 'https://www.brightdesigns.band/shows/test-show',
      image: 'https://img.example/x.png',
    })
  })
})
