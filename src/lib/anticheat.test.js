import { describe, it, expect } from 'vitest'
import { inspectProof, REJECTION, MIN_PROOF_BYTES, MAX_PROOF_AGE_MS } from './anticheat.js'

const NOW = new Date('2026-09-09T12:00:00Z').getTime()
const BIG = MIN_PROOF_BYTES * 40

const proof = (overrides = {}) => ({
  type: 'video/mp4',
  size: BIG,
  lastModified: NOW - 60_000,
  ...overrides,
})

describe('inspectProof', () => {
  it('accepts a fresh video for a video drill', () => {
    expect(inspectProof(proof(), 'video', NOW)).toEqual({ ok: true, message: '' })
  })

  it('accepts a fresh photo for a photo drill', () => {
    expect(inspectProof(proof({ type: 'image/jpeg' }), 'photo', NOW).ok).toBe(true)
  })

  it('accepts a video where only a photo was required — more evidence, not less', () => {
    expect(inspectProof(proof(), 'photo', NOW).ok).toBe(true)
  })

  it('rejects a photo passed off as a video drill', () => {
    expect(inspectProof(proof({ type: 'image/png' }), 'video', NOW)).toEqual({
      ok: false,
      message: REJECTION.NEEDS_VIDEO,
    })
  })

  it('rejects a non-media file on a photo drill', () => {
    expect(inspectProof(proof({ type: 'application/pdf' }), 'photo', NOW).message).toBe(
      REJECTION.NEEDS_MEDIA,
    )
  })

  it('rejects a missing file', () => {
    expect(inspectProof(null, 'video', NOW).ok).toBe(false)
  })

  it('rejects a placeholder file too small to hold a rep', () => {
    expect(inspectProof(proof({ size: MIN_PROOF_BYTES - 1 }), 'video', NOW).message).toBe(
      REJECTION.TOO_SMALL,
    )
  })

  it('accepts a file exactly on the size threshold', () => {
    expect(inspectProof(proof({ size: MIN_PROOF_BYTES }), 'video', NOW).ok).toBe(true)
  })

  it('rejects proof recycled from an older session', () => {
    const stale = proof({ lastModified: NOW - MAX_PROOF_AGE_MS - 1 })
    expect(inspectProof(stale, 'video', NOW).message).toBe(REJECTION.TOO_OLD)
  })

  it('accepts proof captured exactly on the age boundary', () => {
    const edge = proof({ lastModified: NOW - MAX_PROOF_AGE_MS })
    expect(inspectProof(edge, 'video', NOW).ok).toBe(true)
  })

  it('checks media type before size, so the message names the real problem', () => {
    const wrongAndTiny = proof({ type: 'image/png', size: 10 })
    expect(inspectProof(wrongAndTiny, 'video', NOW).message).toBe(REJECTION.NEEDS_VIDEO)
  })

  it('never returns ok with a message, or a rejection without one', () => {
    const cases = [
      [proof(), 'video'],
      [proof({ type: 'image/png' }), 'video'],
      [proof({ size: 1 }), 'video'],
      [proof({ lastModified: 0 }), 'photo'],
    ]
    for (const [file, required] of cases) {
      const result = inspectProof(file, required, NOW)
      if (result.ok) {
        expect(result.message).toBe('')
      } else {
        expect(result.message.length).toBeGreaterThan(0)
      }
    }
  })
})
