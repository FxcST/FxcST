/**
 * Local half of the anti-cheat gate. These checks run in the browser before a
 * proof is ever submitted, so the obvious cheats — a screenshot instead of a
 * clip, an empty placeholder file, footage recycled from last month — are
 * rejected immediately with an explanation the player can act on.
 */

/** Proof shot more than a day ago is almost always recycled from an old session. */
export const MAX_PROOF_AGE_MS = 24 * 60 * 60 * 1000

/** Anything under this is too short to contain a full rep. */
export const MIN_PROOF_BYTES = 12 * 1024

export const REJECTION = {
  NEEDS_VIDEO: 'This drill needs a video clip — a photo will not verify.',
  NEEDS_MEDIA: 'Upload a photo or video of your session.',
  TOO_SMALL: 'That file is too small to show a full rep. Record again.',
  TOO_OLD: 'Proof must be captured within the last 24 hours.',
}

/**
 * @param {{ type: string, size: number, lastModified?: number }} file
 * @param {'video' | 'photo'} required
 * @param {number} [now] injectable clock, so age checks are testable
 * @returns {{ ok: boolean, message: string }}
 */
export function inspectProof(file, required, now = Date.now()) {
  if (!file) return { ok: false, message: REJECTION.NEEDS_MEDIA }

  const wantsVideo = required === 'video'
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (wantsVideo && !isVideo) {
    return { ok: false, message: REJECTION.NEEDS_VIDEO }
  }
  // A photo drill still accepts a video — more evidence, not less.
  if (!wantsVideo && !isImage && !isVideo) {
    return { ok: false, message: REJECTION.NEEDS_MEDIA }
  }
  if (file.size < MIN_PROOF_BYTES) {
    return { ok: false, message: REJECTION.TOO_SMALL }
  }
  if (file.lastModified && now - file.lastModified > MAX_PROOF_AGE_MS) {
    return { ok: false, message: REJECTION.TOO_OLD }
  }

  return { ok: true, message: '' }
}
