import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { YouTubeFacade } from '../youtube-facade'

// The show page emits a VideoObject whenever it has a YouTube URL, so the
// video must be visible there too. The facade is the thumbnail and a play
// button; the iframe (and everything YouTube loads with it) waits for a click.
describe('YouTubeFacade', () => {
  it('renders the thumbnail and no iframe until play is pressed', async () => {
    const { container } = render(
      <YouTubeFacade youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="True North performance" />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // next/image routes remote images through /_next/image?url=<encoded>.
    expect(decodeURIComponent(img!.getAttribute('src') ?? '')).toContain(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
    expect(img!.getAttribute('loading')).toBe('lazy')
    expect(container.querySelector('iframe')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Play video: True North performance' }))

    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe!.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1')
    expect(iframe!.getAttribute('title')).toBe('True North performance')
    expect(container.querySelector('img')).toBeNull()
  })

  it('server HTML carries the i.ytimg.com poster and no iframe', () => {
    const html = renderToString(
      <YouTubeFacade youtubeUrl="https://youtu.be/dQw4w9WgXcQ" title="Apex performance" />,
    )
    // next/image encodes the source into /_next/image?url=…
    expect(html).toContain(encodeURIComponent('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'))
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('youtube-nocookie')
  })

  it('renders nothing when no video id can be read', () => {
    const { container } = render(<YouTubeFacade youtubeUrl="https://example.com/v" title="x" />)
    expect(container).toBeEmptyDOMElement()
  })
})
