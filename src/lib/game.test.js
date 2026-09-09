import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  xpForLevel,
  levelFromXp,
  rankForLevel,
  ordinal,
  formatXp,
  loadProgress,
  saveProgress,
} from './game.js'

describe('xpForLevel', () => {
  it('starts shallow so a new player levels quickly', () => {
    expect(xpForLevel(1)).toBe(400)
  })

  it('grows by a fixed step each level', () => {
    expect(xpForLevel(2) - xpForLevel(1)).toBe(250)
    expect(xpForLevel(9) - xpForLevel(8)).toBe(250)
  })
})

describe('levelFromXp', () => {
  it('puts a brand new player at level 1 with nothing banked', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, progress: 0 })
  })

  it('keeps a player on their level until the threshold is cleared', () => {
    expect(levelFromXp(399).level).toBe(1)
    expect(levelFromXp(400).level).toBe(2)
  })

  it('carries the remainder into the new level', () => {
    const result = levelFromXp(450)
    expect(result.level).toBe(2)
    expect(result.xpIntoLevel).toBe(50)
    expect(result.xpForNext).toBe(650)
    expect(result.xpRemaining).toBe(600)
  })

  it('reports progress as a 0..1 fraction of the current level', () => {
    const result = levelFromXp(400 + 325)
    expect(result.progress).toBeCloseTo(0.5, 5)
  })

  it('never reports progress above 1', () => {
    for (const xp of [0, 399, 400, 4820, 25000]) {
      expect(levelFromXp(xp).progress).toBeLessThanOrEqual(1)
      expect(levelFromXp(xp).progress).toBeGreaterThanOrEqual(0)
    }
  })

  it('is monotonic — more XP is never a lower level', () => {
    let previous = 0
    for (let xp = 0; xp < 30000; xp += 137) {
      const { level } = levelFromXp(xp)
      expect(level).toBeGreaterThanOrEqual(previous)
      previous = level
    }
  })

  it('places the seeded player where the dashboard shows them', () => {
    expect(levelFromXp(4820)).toMatchObject({ level: 6, xpIntoLevel: 320, xpForNext: 1650 })
  })
})

describe('rankForLevel', () => {
  it.each([
    [1, 'Rookie'],
    [3, 'Rookie'],
    [4, 'Prospect'],
    [7, 'Starter'],
    [10, 'Playmaker'],
    [14, 'Captain'],
    [18, 'Elite'],
    [99, 'Elite'],
  ])('level %i is %s', (level, rank) => {
    expect(rankForLevel(level)).toBe(rank)
  })
})

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [101, '101st'],
    [111, '111th'],
  ])('%i renders as %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected)
  })
})

describe('formatXp', () => {
  it('groups thousands for readability', () => {
    expect(formatXp(4820)).toBe('4,820')
    expect(formatXp(120)).toBe('120')
  })
})

describe('progress persistence', () => {
  const seed = { xp: 100, streak: 1, sessions: 0, completed: [], town: 'London' }

  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns the fallback when nothing has been saved', () => {
    expect(loadProgress(seed)).toEqual(seed)
  })

  it('round-trips a saved run', () => {
    saveProgress({ ...seed, xp: 5000, completed: ['wall-passes-100'] })
    expect(loadProgress(seed)).toMatchObject({ xp: 5000, completed: ['wall-passes-100'] })
  })

  it('merges the fallback over a partial save, so new fields are never undefined', () => {
    window.localStorage.setItem('fxcst.progress.v1', JSON.stringify({ xp: 900 }))
    expect(loadProgress(seed)).toEqual({ ...seed, xp: 900 })
  })

  it('falls back to the seed rather than crashing on corrupt storage', () => {
    window.localStorage.setItem('fxcst.progress.v1', '{not json')
    expect(loadProgress(seed)).toEqual(seed)
  })

  it('survives storage being blocked entirely', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveProgress(seed)).not.toThrow()
  })
})
