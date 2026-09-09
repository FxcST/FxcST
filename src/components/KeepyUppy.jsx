import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Trophy, Zap, Footprints } from 'lucide-react'
import { createGame, flap, step, WORLD } from '../game/engine.js'
import { draw, fitCanvas } from '../game/render.js'

const BEST_KEY = 'fxcst.arcade.best.v1'

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function saveBest(best) {
  try {
    window.localStorage.setItem(BEST_KEY, String(best))
  } catch {
    // Storage blocked — the best score just will not survive a reload.
  }
}

export default function KeepyUppy() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Mirrors of engine state, updated only when they change, so the render loop
  // itself never triggers a React re-render.
  const [status, setStatus] = useState('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(loadBest)

  /** Created on first use so mounting does not need an effect to seed it. */
  const getGame = useCallback(() => {
    if (!gameRef.current) gameRef.current = createGame({ best: loadBest() })
    return gameRef.current
  }, [])

  const start = useCallback(() => {
    gameRef.current = createGame({ best: loadBest() })
    setScore(0)
    setStatus('ready')
  }, [])

  const tap = useCallback(() => {
    const game = getGame()

    if (game.status === 'dead') {
      start()
      return
    }
    flap(game)
    if (game.status === 'playing') setStatus('playing')
  }, [getGame, start])

  // The animation loop. It owns the canvas directly and reads state via refs.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    fitCanvas(canvas, ctx, window.devicePixelRatio || 1)

    const loop = (time) => {
      frameRef.current = requestAnimationFrame(loop)
      const game = getGame()

      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0
      lastTimeRef.current = time

      step(game, dt)
      draw(ctx, game)

      if (game.justScored) setScore(game.score)
      if (game.justDied) {
        setStatus('dead')
        setBest(game.best)
        saveBest(game.best)
      }
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frameRef.current)
      lastTimeRef.current = 0
    }
  }, [getGame])

  // Space and Enter play too, so the game is not mouse-only.
  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return
      event.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tap])

  // A backgrounded tab resumes with a huge delta; drop it rather than
  // teleporting the ball into a defender.
  useEffect(() => {
    const onVisibility = () => {
      lastTimeRef.current = 0
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const isNewBest = status === 'dead' && score > 0 && score >= best

  return (
    <section className="space-y-3" aria-label="Keepy Uppy mini game">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h2 className="font-display text-xl tracking-wide">Keepy Uppy</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
          <Trophy className="h-3 w-3" aria-hidden="true" />
          Best {best}
        </span>
      </header>

      <div
        className="relative mx-auto w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 select-none"
        style={{ aspectRatio: `${WORLD.width} / ${WORLD.height}`, maxWidth: WORLD.width }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Keepy Uppy pitch. Score ${score}.`}
          className="block h-full w-full touch-none"
          onPointerDown={(event) => {
            event.preventDefault()
            tap()
          }}
        />

        {/* Live score, out of the canvas so it stays crisp and readable. */}
        <p
          className="pointer-events-none absolute inset-x-0 top-4 text-center font-display text-5xl tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
          aria-hidden="true"
        >
          {score}
        </p>

        <div aria-live="polite" className="sr-only">
          {status === 'dead' ? `Run over. You scored ${score}. Best ${best}.` : ''}
        </div>

        {status === 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/55 px-6 text-center">
            <Play className="h-9 w-9 text-emerald-400" aria-hidden="true" />
            <p className="font-display text-3xl tracking-wide">Tap to kick</p>
            <p className="text-xs text-slate-300">
              Keep the ball up and thread the gap between the defenders.
            </p>
          </div>
        )}

        {status === 'dead' && (
          <div className="absolute inset-0 flex animate-pop-in flex-col items-center justify-center gap-1 bg-slate-950/75 px-6 text-center">
            <p className="font-display text-3xl tracking-wide text-slate-100">
              {isNewBest ? 'New best!' : 'Out of play'}
            </p>
            <p className="font-display text-6xl leading-none tracking-wide text-emerald-300">
              {score}
            </p>
            <p className="text-xs text-slate-400">
              {isNewBest ? 'Your best run yet.' : `Best ${best}`}
            </p>
            <button
              type="button"
              onClick={tap}
              className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Play again
            </button>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
        Arcade scores are just for fun — they sit outside your training XP, so the
        town leaderboard stays earned on the pitch.
      </p>
    </section>
  )
}
