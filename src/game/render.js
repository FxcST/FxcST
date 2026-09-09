import { CONFIG, WORLD, playfieldHeight, wallRects } from './engine.js'

const COLORS = {
  sky: '#020617',
  skyGlow: 'rgba(16, 185, 129, 0.10)',
  wall: '#1e293b',
  wallEdge: '#334155',
  wallStripe: 'rgba(16, 185, 129, 0.22)',
  grass: '#064e3b',
  grassLine: 'rgba(255, 255, 255, 0.12)',
  ball: '#f8fafc',
  ballPanel: '#0f172a',
  shadow: 'rgba(0, 0, 0, 0.35)',
}

/** Backdrop: night sky wash plus the scrolling pitch markings. */
function drawPitch(ctx, state) {
  const floor = playfieldHeight()

  ctx.fillStyle = COLORS.sky
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  const glow = ctx.createRadialGradient(WORLD.width / 2, 0, 0, WORLD.width / 2, 0, WORLD.height)
  glow.addColorStop(0, COLORS.skyGlow)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  ctx.fillStyle = COLORS.grass
  ctx.fillRect(0, floor, WORLD.width, WORLD.groundHeight)

  // Mown stripes that slide past, so speed is legible even against a flat sky.
  const stripe = 44
  const offset = (state.elapsed * 60) % stripe
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  for (let x = -offset; x < WORLD.width; x += stripe * 2) {
    ctx.fillRect(x, floor, stripe, WORLD.groundHeight)
  }

  ctx.strokeStyle = COLORS.grassLine
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, floor + 1)
  ctx.lineTo(WORLD.width, floor + 1)
  ctx.stroke()
}

function drawWalls(ctx, state) {
  for (const wall of state.walls) {
    for (const rect of wallRects(wall)) {
      if (rect.height <= 0) continue

      ctx.fillStyle = COLORS.wall
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

      ctx.fillStyle = COLORS.wallStripe
      ctx.fillRect(rect.x, rect.y, 4, rect.height)
      ctx.fillRect(rect.x + rect.width - 4, rect.y, 4, rect.height)

      // A lip on the edge that faces the gap reads as a goalpost.
      const lipY = rect.y === 0 ? rect.y + rect.height - 12 : rect.y
      ctx.fillStyle = COLORS.wallEdge
      ctx.fillRect(rect.x - 4, lipY, rect.width + 8, 12)
    }
  }
}

function drawBall(ctx, state) {
  const { ballX, ballRadius } = CONFIG
  const y = state.ball.y

  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = COLORS.shadow
  ctx.beginPath()
  ctx.ellipse(ballX, playfieldHeight() - 4, ballRadius * 0.9, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(ballX, y)
  ctx.rotate(state.ball.spin)

  ctx.fillStyle = COLORS.ball
  ctx.beginPath()
  ctx.arc(0, 0, ballRadius, 0, Math.PI * 2)
  ctx.fill()

  // Five panels, enough to make the spin read at this size.
  ctx.fillStyle = COLORS.ballPanel
  ctx.beginPath()
  ctx.arc(0, 0, ballRadius * 0.34, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(
      Math.cos(angle) * ballRadius * 0.68,
      Math.sin(angle) * ballRadius * 0.68,
      ballRadius * 0.2,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.restore()
}

/** Draw one frame. Kept free of React so the loop never re-renders the tree. */
export function draw(ctx, state) {
  drawPitch(ctx, state)
  drawWalls(ctx, state)
  drawBall(ctx, state)
}

/**
 * Size the backing store for the device's pixel ratio and scale the context so
 * all drawing can use world coordinates.
 */
export function fitCanvas(canvas, ctx, ratio = 1) {
  const scale = Math.min(Math.max(ratio, 1), 3)
  canvas.width = WORLD.width * scale
  canvas.height = WORLD.height * scale
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  return scale
}
