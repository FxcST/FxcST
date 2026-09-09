import { describe, it, expect } from 'vitest'
import { awardForRun, xpForScore, today, DAILY_CAP } from './arcade.js'

const fresh = { arcadeXpDate: undefined, arcadeXpEarned: 0 }
const DAY = '2026-09-09'

describe('xpForScore', () => {
  it('pays one XP per defender beaten', () => {
    expect(xpForScore(7)).toBe(7)
  })

  it('never pays for a scoreless or negative run', () => {
    expect(xpForScore(0)).toBe(0)
    expect(xpForScore(-3)).toBe(0)
  })
})

describe('today', () => {
  it('formats the local calendar day', () => {
    expect(today(new Date(2026, 8, 9))).toBe('2026-09-09')
  })

  it('zero-pads single digits', () => {
    expect(today(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('awardForRun', () => {
  it('awards the full score when nothing has been earned today', () => {
    const result = awardForRun(8, fresh, DAY)
    expect(result.xp).toBe(8)
    expect(result.cappedOut).toBe(false)
    expect(result.arcadeXpEarned).toBe(8)
    expect(result.remainingAfter).toBe(DAILY_CAP - 8)
  })

  it('adds to what is already banked today', () => {
    const result = awardForRun(5, { arcadeXpDate: DAY, arcadeXpEarned: 6 }, DAY)
    expect(result.xp).toBe(5)
    expect(result.arcadeXpEarned).toBe(11)
  })

  it('clips a big run to the remaining allowance', () => {
    const result = awardForRun(50, { arcadeXpDate: DAY, arcadeXpEarned: 15 }, DAY)
    expect(result.xp).toBe(5)
    expect(result.cappedOut).toBe(true)
    expect(result.arcadeXpEarned).toBe(DAILY_CAP)
    expect(result.remainingAfter).toBe(0)
  })

  it('pays nothing once the cap is spent, however good the run', () => {
    const result = awardForRun(999, { arcadeXpDate: DAY, arcadeXpEarned: DAILY_CAP }, DAY)
    expect(result.xp).toBe(0)
    expect(result.cappedOut).toBe(true)
    expect(result.arcadeXpEarned).toBe(DAILY_CAP)
  })

  it('never exceeds the cap no matter how many runs are played', () => {
    let progress = { ...fresh }
    let total = 0
    for (let run = 0; run < 40; run += 1) {
      const result = awardForRun(9, progress, DAY)
      total += result.xp
      progress = { arcadeXpDate: result.arcadeXpDate, arcadeXpEarned: result.arcadeXpEarned }
    }
    expect(total).toBe(DAILY_CAP)
  })

  it('resets the allowance on a new day', () => {
    const spent = { arcadeXpDate: '2026-09-08', arcadeXpEarned: DAILY_CAP }
    const result = awardForRun(12, spent, DAY)
    expect(result.xp).toBe(12)
    expect(result.arcadeXpEarned).toBe(12)
  })

  it('treats a missing daily record as a fresh day', () => {
    expect(awardForRun(4, {}, DAY).xp).toBe(4)
  })

  it('awards nothing for a scoreless run but still stamps the day', () => {
    const result = awardForRun(0, fresh, DAY)
    expect(result.xp).toBe(0)
    expect(result.cappedOut).toBe(false)
    expect(result.arcadeXpDate).toBe(DAY)
  })

  it('cannot be gamed to outpace a single verified drill', () => {
    // The cheapest drill is worth 80 XP; a whole day of arcade is worth less.
    expect(DAILY_CAP).toBeLessThan(80)
  })
})
