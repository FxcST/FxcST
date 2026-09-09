/**
 * "Keepy Uppy" — a one-tap arcade loop in the Flappy Bird family.
 *
 * Tap to kick the ball upward; gravity does the rest. Thread the gap between
 * each pair of defenders. One touch and the run is over.
 *
 * The engine is deliberately free of canvas, DOM and timers: it is a state
 * object plus pure-ish functions stepped by a delta time, seeded by an
 * injectable RNG. That makes every rule here testable without a browser, and
 * keeps rendering a separate concern (see components/KeepyUppy.jsx).
 */

export const WORLD = {
  width: 360,
  height: 560,
  groundHeight: 56,
}

export const CONFIG = {
  ballRadius: 12,
  ballX: 96,
  gravity: 1350, // px/s²
  flapVelocity: -380, // px/s, instant on tap
  maxFallSpeed: 700,
  baseSpeed: 152, // px/s the world scrolls
  speedPerPoint: 2.6,
  maxSpeed: 270,
  wallWidth: 58,
  spacing: 208, // horizontal distance between defender pairs
  baseGap: 178,
  gapPerPoint: 1.8, // the squeeze that makes a long run tense
  minGap: 150,
  margin: 44, // keeps a gap from hugging the ceiling or the ground
  /**
   * How far a gap may sit from the previous one. Without this the RNG can put
   * two gaps at opposite ends of the pitch with no reachable path between
   * them, which reads as the game cheating rather than as difficulty.
   */
  maxGapShift: 110,
  /** A tap this long before landing on the ground still counts. */
  maxStep: 1 / 30,
}

/** Deterministic RNG so a seeded run replays identically in tests. */
export function makeRng(seed = 1) {
  let t = seed >>> 0
  return function rng() {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export const playfieldHeight = () => WORLD.height - WORLD.groundHeight

/** Scroll speed and gap size both tighten with the score. */
export function speedAt(score) {
  return Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + score * CONFIG.speedPerPoint)
}

export function gapAt(score) {
  return Math.max(CONFIG.minGap, CONFIG.baseGap - score * CONFIG.gapPerPoint)
}

function spawnWall(state, x) {
  const gap = gapAt(state.score)
  const span = playfieldHeight() - CONFIG.margin * 2 - gap
  const lowest = CONFIG.margin
  const highest = playfieldHeight() - CONFIG.margin - gap

  let gapTop = lowest + state.rng() * Math.max(0, span)

  // Keep consecutive gaps within reach of one another.
  const reachableLow = Math.max(lowest, state.lastGapCentre - CONFIG.maxGapShift - gap / 2)
  const reachableHigh = Math.min(highest, state.lastGapCentre + CONFIG.maxGapShift - gap / 2)
  gapTop = Math.min(Math.max(gapTop, reachableLow), Math.max(reachableLow, reachableHigh))

  state.lastGapCentre = gapTop + gap / 2
  state.walls.push({ x, gapTop, gap, scored: false })
}

export function createGame({ seed = Date.now(), best = 0 } = {}) {
  const state = {
    status: 'ready', // ready | playing | dead
    rng: makeRng(seed),
    ball: { y: playfieldHeight() / 2, vy: 0, spin: 0 },
    walls: [],
    /** Anchor for the reachability rule above. */
    lastGapCentre: playfieldHeight() / 2,
    score: 0,
    best,
    /** Set on the frame the run ends, so the UI can react once. */
    justDied: false,
    /** Set on the frame a wall is cleared, for the pop animation and sound. */
    justScored: false,
    elapsed: 0,
  }

  spawnWall(state, WORLD.width + 40)
  spawnWall(state, WORLD.width + 40 + CONFIG.spacing)
  return state
}

/** A tap. The first one starts the run; taps after death are ignored. */
export function flap(state) {
  if (state.status === 'dead') return state

  if (state.status === 'ready') state.status = 'playing'
  state.ball.vy = CONFIG.flapVelocity
  return state
}

function endRun(state) {
  state.status = 'dead'
  state.justDied = true
  state.best = Math.max(state.best, state.score)
  return state
}

/** Circle-vs-rectangle overlap, via the closest point on the rectangle. */
export function hitsRect(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height))
  const dx = cx - nearestX
  const dy = cy - nearestY
  return dx * dx + dy * dy < r * r
}

/** The two rectangles a wall occupies: above the gap and below it. */
export function wallRects(wall) {
  return [
    { x: wall.x, y: 0, width: CONFIG.wallWidth, height: wall.gapTop },
    {
      x: wall.x,
      y: wall.gapTop + wall.gap,
      width: CONFIG.wallWidth,
      height: playfieldHeight() - (wall.gapTop + wall.gap),
    },
  ]
}

/**
 * Advance the world by `dt` seconds. Large steps (a backgrounded tab, a slow
 * frame) are clamped so the ball can never tunnel through a defender.
 */
export function step(state, dt) {
  state.justDied = false
  state.justScored = false

  if (state.status === 'dead') return state

  const delta = Math.min(Math.max(dt, 0), CONFIG.maxStep)
  state.elapsed += delta

  // Before the first tap the ball hovers, so the ready screen is readable.
  if (state.status === 'ready') {
    state.ball.y = playfieldHeight() / 2 + Math.sin(state.elapsed * 3) * 8
    return state
  }

  const speed = speedAt(state.score)

  state.ball.vy = Math.min(state.ball.vy + CONFIG.gravity * delta, CONFIG.maxFallSpeed)
  state.ball.y += state.ball.vy * delta
  state.ball.spin += speed * delta * 0.06

  for (const wall of state.walls) {
    wall.x -= speed * delta
  }
  state.walls = state.walls.filter((wall) => wall.x + CONFIG.wallWidth > -20)

  const last = state.walls[state.walls.length - 1]
  if (!last || last.x < WORLD.width - CONFIG.spacing) {
    spawnWall(state, (last ? last.x : WORLD.width) + CONFIG.spacing)
  }

  // The ceiling is a soft stop; only the ground and the defenders are fatal.
  if (state.ball.y - CONFIG.ballRadius < 0) {
    state.ball.y = CONFIG.ballRadius
    state.ball.vy = 0
  }
  if (state.ball.y + CONFIG.ballRadius >= playfieldHeight()) {
    state.ball.y = playfieldHeight() - CONFIG.ballRadius
    return endRun(state)
  }

  for (const wall of state.walls) {
    for (const rect of wallRects(wall)) {
      if (hitsRect(CONFIG.ballX, state.ball.y, CONFIG.ballRadius, rect)) {
        return endRun(state)
      }
    }
    if (!wall.scored && wall.x + CONFIG.wallWidth < CONFIG.ballX - CONFIG.ballRadius) {
      wall.scored = true
      state.score += 1
      state.justScored = true
    }
  }

  return state
}
