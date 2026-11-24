import { describe, expect, it } from 'vitest'
import { flattenDocumentText, formatDocumentDate, sanitizeFileName } from './documentText.js'

describe('document text helpers', () => {
  it('flattens nested TipTap content without losing word boundaries', () => {
    const content = { content: [{ content: [{ text: 'Cloud' }, { text: 'Sync' }] }, { content: [{ text: 'together' }] }] }
    expect(flattenDocumentText(content)).toBe('Cloud Sync together')
  })

  it('creates safe lower-case download names', () => {
    expect(sanitizeFileName(' Q4: Launch / Plan ')).toBe('q4-launch-plan')
    expect(sanitizeFileName('***')).toBe('cloudsync-document')
  })

  it('formats missing, recent, and older timestamps', () => {
    const now = new Date('2026-06-10T12:00:00Z').getTime()
    expect(formatDocumentDate(null, now)).toBe('Just created')
    expect(formatDocumentDate(new Date(now - 90_000), now)).toBe('1 min ago')
    expect(formatDocumentDate(new Date(now - 3_600_000), now)).toBe('1 hr ago')
  })
})
