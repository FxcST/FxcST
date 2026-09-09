/**
 * Arcade XP.
 *
 * The mini-game feeds training XP, but only a trickle. Tapping a screen is not
 * proof of training, so the daily cap is what keeps the town leaderboard
 * earned on the pitch: a player who only ever plays the game can gain at most
 * DAILY_CAP a day, far less than a single verified drill.
 */

export const DAILY_CAP = 20

/** One XP per defender beaten, before the cap is applied. */
export function xpForScore(score) {
  return Math.max(0, Math.floor(score))
}

/** Local calendar day, so the cap resets at the player's midnight. */
export function today(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Work out what a run is actually worth given what has already been earned
 * today. Returns the XP to award and the new daily total to store.
 *
 * @param {number} score defenders beaten this run
 * @param {{ arcadeXpDate?: string, arcadeXpEarned?: number }} progress
 * @param {string} [day] the current local day
 */
export function awardForRun(score, progress, day = today()) {
  // A new day wipes yesterday's total rather than carrying it forward.
  const earnedToday = progress.arcadeXpDate === day ? (progress.arcadeXpEarned ?? 0) : 0
  const remaining = Math.max(0, DAILY_CAP - earnedToday)
  const xp = Math.min(xpForScore(score), remaining)

  return {
    xp,
    cappedOut: xp < xpForScore(score),
    arcadeXpDate: day,
    arcadeXpEarned: earnedToday + xp,
    remainingAfter: remaining - xp,
  }
}
