import { describe, it, expect } from 'vitest'
import {
  createGame,
  flap,
  step,
  speedAt,
  gapAt,
  hitsRect,
  wallRects,
  playfieldHeight,
  makeRng,
  CONFIG,
  WORLD,
} from './engine.js'

const FRAME = 1 / 60
const game = (opts) => createGame({ seed: 42, ...opts })

/** Run n frames, or until the run ends. */
function play(state, frames, onFrame) {
  for (let i = 0; i < frames; i += 1) {
    onFrame?.(state, i)
    step(state, FRAME)
    if (state.status === 'dead') break
  }
  return state
}

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(7)
    const b = makeRng(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('stays within 0..1', () => {
    const rng = makeRng(3)
    for (let i = 0; i < 500; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('gives different streams for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })
})

describe('difficulty curve', () => {
  it('starts at the base speed and widest gap', () => {
    expect(speedAt(0)).toBe(CONFIG.baseSpeed)
    expect(gapAt(0)).toBe(CONFIG.baseGap)
  })

  it('speeds up and squeezes the gap as the score climbs', () => {
    expect(speedAt(10)).toBeGreaterThan(speedAt(0))
    expect(gapAt(10)).toBeLessThan(gapAt(0))
  })

  it('clamps at a speed and a gap that stay playable', () => {
    expect(speedAt(10_000)).toBe(CONFIG.maxSpeed)
    expect(gapAt(10_000)).toBe(CONFIG.minGap)
  })

  it('is monotonic in both directions', () => {
    for (let score = 1; score < 200; score += 1) {
      expect(speedAt(score)).toBeGreaterThanOrEqual(speedAt(score - 1))
      expect(gapAt(score)).toBeLessThanOrEqual(gapAt(score - 1))
    }
  })
})

describe('createGame', () => {
  it('starts ready, scoreless and centred', () => {
    const state = game()
    expect(state.status).toBe('ready')
    expect(state.score).toBe(0)
    expect(state.ball.vy).toBe(0)
    expect(state.ball.y).toBeCloseTo(playfieldHeight() / 2)
  })

  it('carries a previous best into the new run', () => {
    expect(game({ best: 17 }).best).toBe(17)
  })

  it('seeds two defenders off the right edge', () => {
    const state = game()
    expect(state.walls).toHaveLength(2)
    for (const wall of state.walls) {
      expect(wall.x).toBeGreaterThan(WORLD.width)
      expect(wall.scored).toBe(false)
    }
  })

  it('keeps every gap clear of the ceiling and the ground', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const state = createGame({ seed })
      play(state, 400, (s, i) => i % 40 === 0 && flap(s))
      for (const wall of state.walls) {
        expect(wall.gapTop).toBeGreaterThanOrEqual(CONFIG.margin - 0.001)
        expect(wall.gapTop + wall.gap).toBeLessThanOrEqual(playfieldHeight() - CONFIG.margin + 0.001)
      }
    }
  })

  it('replays identically for the same seed', () => {
    const runA = play(game(), 200, (s, i) => i % 30 === 0 && flap(s))
    const runB = play(game(), 200, (s, i) => i % 30 === 0 && flap(s))
    expect(runA.score).toBe(runB.score)
    expect(runA.ball.y).toBeCloseTo(runB.ball.y, 6)
  })
})

describe('ready state', () => {
  it('does not fall before the first tap', () => {
    const state = game()
    play(state, 300)
    expect(state.status).toBe('ready')
    expect(state.ball.y).toBeGreaterThan(0)
    expect(state.ball.y).toBeLessThan(playfieldHeight())
  })

  it('holds the walls still until the run starts', () => {
    const state = game()
    const x = state.walls[0].x
    play(state, 120)
    expect(state.walls[0].x).toBe(x)
  })

  it('starts the run on the first tap', () => {
    const state = flap(game())
    expect(state.status).toBe('playing')
    expect(state.ball.vy).toBe(CONFIG.flapVelocity)
  })
})

describe('flap', () => {
  it('replaces downward velocity outright, so a tap always saves you', () => {
    const state = flap(game())
    play(state, 40)
    expect(state.ball.vy).toBeGreaterThan(0) // falling
    flap(state)
    expect(state.ball.vy).toBe(CONFIG.flapVelocity)
  })

  it('is ignored once the run is over', () => {
    const state = flap(game())
    play(state, 2000)
    expect(state.status).toBe('dead')
    const vy = state.ball.vy
    flap(state)
    expect(state.ball.vy).toBe(vy)
    expect(state.status).toBe('dead')
  })
})

describe('physics', () => {
  it('accelerates downward under gravity', () => {
    const state = flap(game())
    const first = state.ball.vy
    step(state, FRAME)
    expect(state.ball.vy).toBeCloseTo(first + CONFIG.gravity * FRAME, 5)
  })

  it('caps fall speed so a long drop stays controllable', () => {
    const state = flap(game())
    play(state, 600)
    expect(state.ball.vy).toBeLessThanOrEqual(CONFIG.maxFallSpeed)
  })

  it('clamps an oversized frame so the ball cannot tunnel through a defender', () => {
    const slow = flap(game())
    const fast = flap(game())
    step(slow, CONFIG.maxStep)
    step(fast, 5) // a backgrounded tab
    expect(fast.ball.y).toBeCloseTo(slow.ball.y, 6)
  })

  it('ignores a negative delta', () => {
    const state = flap(game())
    const y = state.ball.y
    step(state, -1)
    expect(state.ball.y).toBe(y)
  })

  it('bounces off the ceiling without ending the run', () => {
    const state = flap(game())
    for (let i = 0; i < 30; i += 1) {
      flap(state)
      step(state, FRAME)
    }
    expect(state.status).toBe('playing')
    expect(state.ball.y).toBeGreaterThanOrEqual(CONFIG.ballRadius)
  })

  it('ends the run on the ground', () => {
    const state = flap(game())
    play(state, 600)
    expect(state.status).toBe('dead')
    expect(state.ball.y + CONFIG.ballRadius).toBeCloseTo(playfieldHeight(), 5)
  })
})

describe('collision helpers', () => {
  const rect = { x: 100, y: 100, width: 50, height: 50 }

  it('detects a centre-on hit', () => {
    expect(hitsRect(125, 125, 10, rect)).toBe(true)
  })

  it('detects a clipped corner', () => {
    expect(hitsRect(96, 96, 10, rect)).toBe(true)
  })

  it('misses a corner that is just out of reach', () => {
    expect(hitsRect(90, 90, 10, rect)).toBe(false)
  })

  it('misses a clean pass above and below', () => {
    expect(hitsRect(125, 80, 10, rect)).toBe(false)
    expect(hitsRect(125, 170, 10, rect)).toBe(false)
  })

  it('splits a wall into a top and bottom piece with the gap between them', () => {
    const [top, bottom] = wallRects({ x: 200, gapTop: 150, gap: 170 })
    expect(top.y).toBe(0)
    expect(top.height).toBe(150)
    expect(bottom.y).toBe(320)
    expect(bottom.y + bottom.height).toBeCloseTo(playfieldHeight())
  })
})

describe('scoring', () => {
  it('scores a wall only once, as it passes behind the ball', () => {
    const state = flap(game())
    state.walls = [{ x: CONFIG.ballX + 5, gapTop: 10, gap: playfieldHeight() - 20, scored: false }]

    play(state, 240)
    expect(state.score).toBeGreaterThanOrEqual(1)
    expect(state.walls.filter((w) => w.scored).length).toBeLessThanOrEqual(state.score)
  })

  it('raises justScored for exactly one frame', () => {
    const state = flap(game())
    state.walls = [{ x: CONFIG.ballX + 5, gapTop: 10, gap: playfieldHeight() - 20, scored: false }]

    let scoredFrames = 0
    for (let i = 0; i < 120 && state.status === 'playing'; i += 1) {
      step(state, FRAME)
      if (state.justScored) scoredFrames += 1
    }
    expect(scoredFrames).toBe(state.score)
  })

  it('does not score a wall the ball crashed into', () => {
    const state = flap(game())
    state.ball.y = 20
    state.walls = [{ x: CONFIG.ballX, gapTop: 200, gap: 100, scored: false }]

    step(state, FRAME)
    expect(state.status).toBe('dead')
    expect(state.score).toBe(0)
  })

  it('records a new best when the run ends', () => {
    const state = flap(game({ best: 2 }))
    state.score = 9
    play(state, 600)
    expect(state.status).toBe('dead')
    expect(state.best).toBe(9)
  })

  it('keeps the old best when the run falls short of it', () => {
    const state = flap(game({ best: 30 }))
    state.score = 4
    play(state, 600)
    expect(state.best).toBe(30)
  })

  it('raises justDied for exactly one frame', () => {
    const state = flap(game())
    let deaths = 0
    for (let i = 0; i < 900; i += 1) {
      step(state, FRAME)
      if (state.justDied) deaths += 1
    }
    expect(deaths).toBe(1)
  })
})

/** Aim for the middle of the next gap — roughly how a person plays. */
function autopilot(state) {
  const next = state.walls.find(
    (wall) => wall.x + CONFIG.wallWidth > CONFIG.ballX - CONFIG.ballRadius,
  )
  const target = next ? next.gapTop + next.gap / 2 : playfieldHeight() / 2
  if (state.ball.y > target) flap(state)
}

describe('gap reachability', () => {
  it('never places a gap further than one hop from the previous one', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const state = createGame({ seed })
      // Track by object identity: walls are retired as they scroll off, so
      // scanning by value would lose the true spawn order.
      const seen = new Set(state.walls)
      const centres = state.walls.map((wall) => wall.gapTop + wall.gap / 2)

      flap(state)
      play(state, 4000, (s) => {
        autopilot(s)
        for (const wall of s.walls) {
          if (seen.has(wall)) continue
          seen.add(wall)
          centres.push(wall.gapTop + wall.gap / 2)
        }
      })

      expect(centres.length).toBeGreaterThan(5)
      for (let i = 1; i < centres.length; i += 1) {
        expect(Math.abs(centres[i] - centres[i - 1])).toBeLessThanOrEqual(CONFIG.maxGapShift + 0.001)
      }
    }
  })

  it('still keeps every gap inside the playfield once clamped', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const state = createGame({ seed })
      flap(state)
      play(state, 2000, autopilot)
      for (const wall of state.walls) {
        expect(wall.gapTop).toBeGreaterThanOrEqual(CONFIG.margin - 0.001)
        expect(wall.gapTop + wall.gap).toBeLessThanOrEqual(playfieldHeight() - CONFIG.margin + 0.001)
      }
    }
  })
})

describe('the endless world', () => {
  it('keeps spawning defenders ahead and retiring the ones behind', () => {
    const state = flap(game())
    play(state, 3000, autopilot)

    expect(state.score).toBeGreaterThan(3)
    expect(state.walls.length).toBeGreaterThan(0)
    expect(state.walls.length).toBeLessThan(8) // retired, not accumulating
    for (const wall of state.walls) {
      expect(wall.x + CONFIG.wallWidth).toBeGreaterThan(-20)
    }
  })

  it('is fair — a competent player gets a long run out of every seed', () => {
    const scores = []
    for (let seed = 0; seed < 25; seed += 1) {
      const state = createGame({ seed })
      flap(state)
      play(state, 60 * 400, autopilot)
      scores.push(state.score)
    }
    // The ramp should never make a seed unplayable, and never stop biting.
    expect(Math.min(...scores)).toBeGreaterThan(12)
    expect(Math.max(...scores)).toBeLessThan(500)
  })

  it('keeps getting harder — later walls are tighter and faster', () => {
    const state = flap(game())
    const firstGap = state.walls[0].gap
    play(state, 60 * 400, autopilot)
    expect(state.score).toBeGreaterThan(12)
    expect(gapAt(state.score)).toBeLessThan(firstGap)
    expect(speedAt(state.score)).toBeGreaterThan(CONFIG.baseSpeed)
  })
})
