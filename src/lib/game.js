const STORAGE_KEY = 'fxcst.progress.v1'

/**
 * XP required to clear a given level. The curve is deliberately shallow early
 * on so a new player levels up in their first couple of sessions.
 */
export function xpForLevel(level) {
  return 400 + (level - 1) * 250
}

/** Resolve total lifetime XP into level, XP within the level, and the ceiling. */
export function levelFromXp(totalXp) {
  let level = 1
  let remaining = totalXp

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level += 1
  }

  const needed = xpForLevel(level)
  return {
    level,
    xpIntoLevel: remaining,
    xpForNext: needed,
    progress: Math.min(1, remaining / needed),
    xpRemaining: needed - remaining,
  }
}

export const RANKS = [
  { min: 1, name: 'Rookie' },
  { min: 4, name: 'Prospect' },
  { min: 7, name: 'Starter' },
  { min: 10, name: 'Playmaker' },
  { min: 14, name: 'Captain' },
  { min: 18, name: 'Elite' },
]

export function rankForLevel(level) {
  return RANKS.reduce((best, rank) => (level >= rank.min ? rank : best), RANKS[0]).name
}

export function formatXp(xp) {
  return xp.toLocaleString('en-GB')
}

/** Ordinal suffix for leaderboard positions ("1st", "22nd"). */
export function ordinal(n) {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export function loadProgress(fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    // Private browsing or blocked storage — run from the seed instead.
    return fallback
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Nothing to do; progress simply will not survive a reload.
  }
}
