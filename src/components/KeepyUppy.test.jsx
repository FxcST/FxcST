import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KeepyUppy from './KeepyUppy.jsx'

/**
 * jsdom has no canvas backend and no rAF timing, so both are stubbed: the 2D
 * context becomes a recording spy and frames are driven by hand. That leaves
 * the component's own wiring — input, lifecycle, score and best — under test,
 * with the physics covered directly in src/game/engine.test.js.
 */
let frameCallbacks = []
let contextCalls = []

function stubContext() {
  const handler = {
    get(target, prop) {
      if (prop in target) return target[prop]
      return () => {
        contextCalls.push(prop)
        if (prop === 'createRadialGradient') {
          return { addColorStop: () => {} }
        }
        return undefined
      }
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
  }
  return new Proxy({ canvas: null }, handler)
}

/** Advance n animation frames, `ms` apart. */
function advanceFrames(n, ms = 16) {
  for (let i = 0; i < n; i += 1) {
    const due = frameCallbacks
    frameCallbacks = []
    act(() => {
      for (const cb of due) cb((i + 1) * ms)
    })
  }
}

describe('KeepyUppy', () => {
  beforeEach(() => {
    frameCallbacks = []
    contextCalls = []
    window.localStorage.clear()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameCallbacks.push(cb)
      return frameCallbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(stubContext)
  })

  afterEach(() => vi.restoreAllMocks())

  it('opens on the ready screen with a zero score', () => {
    render(<KeepyUppy />)
    expect(screen.getByText('Tap to kick')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Score 0/ })).toBeInTheDocument()
  })

  it('shows a stored best from a previous session', () => {
    window.localStorage.setItem('fxcst.arcade.best.v1', '23')
    render(<KeepyUppy />)
    expect(screen.getByText('Best 23')).toBeInTheDocument()
  })

  it('survives a corrupt stored best', () => {
    window.localStorage.setItem('fxcst.arcade.best.v1', 'not-a-number')
    render(<KeepyUppy />)
    expect(screen.getByText('Best 0')).toBeInTheDocument()
  })

  it('paints the pitch every frame', () => {
    render(<KeepyUppy />)
    advanceFrames(3)
    expect(contextCalls).toContain('fillRect')
    expect(contextCalls).toContain('arc') // the ball
  })

  it('leaves the ready screen on the first tap', async () => {
    const user = userEvent.setup()
    render(<KeepyUppy />)

    await user.pointer({ target: screen.getByRole('img'), keys: '[MouseLeft]' })
    advanceFrames(2)

    expect(screen.queryByText('Tap to kick')).not.toBeInTheDocument()
  })

  it('starts on the space bar too, so it is not pointer-only', () => {
    render(<KeepyUppy />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    })
    advanceFrames(2)

    expect(screen.queryByText('Tap to kick')).not.toBeInTheDocument()
  })

  it('ignores unrelated keys', () => {
    render(<KeepyUppy />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }))
    })
    advanceFrames(2)

    expect(screen.getByText('Tap to kick')).toBeInTheDocument()
  })

  it('ends the run on the ground and offers a replay', () => {
    render(<KeepyUppy />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    })
    advanceFrames(200, 32) // never tap again — the ball drops

    expect(screen.getByText('Out of play')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play again/ })).toBeInTheDocument()
  })

  it('announces the end of a run to assistive tech', () => {
    render(<KeepyUppy />)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    advanceFrames(200, 32)

    expect(screen.getByText(/Run over\. You scored/)).toBeInTheDocument()
  })

  it('restarts from the ready screen when replay is pressed', async () => {
    const user = userEvent.setup()
    render(<KeepyUppy />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    advanceFrames(200, 32)
    await user.click(screen.getByRole('button', { name: /Play again/ }))

    expect(screen.getByText('Tap to kick')).toBeInTheDocument()
    expect(screen.queryByText('Out of play')).not.toBeInTheDocument()
  })

  it('does not lose a stored best to a scoreless run', () => {
    window.localStorage.setItem('fxcst.arcade.best.v1', '12')
    render(<KeepyUppy />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    advanceFrames(200, 32)

    // Shown in both the header badge and the end-of-run panel.
    expect(screen.getAllByText('Best 12').length).toBeGreaterThan(0)
    expect(screen.queryByText('New best!')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('fxcst.arcade.best.v1')).toBe('12')
  })

  it('reports the finished run to its parent exactly once', () => {
    const onRunEnd = vi.fn()
    render(<KeepyUppy onRunEnd={onRunEnd} />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    advanceFrames(200, 32)

    expect(onRunEnd).toHaveBeenCalledTimes(1)
    expect(onRunEnd).toHaveBeenCalledWith(expect.any(Number))
  })

  it('never awards XP itself — that stays the parent\'s decision', () => {
    render(<KeepyUppy onRunEnd={() => {}} />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    advanceFrames(200, 32)

    expect(window.localStorage.getItem('fxcst.progress.v1')).toBeNull()
  })

  it('runs without a parent callback at all', () => {
    render(<KeepyUppy />)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    expect(() => advanceFrames(200, 32)).not.toThrow()
    expect(screen.getByText('Out of play')).toBeInTheDocument()
  })

  it('shows the XP note it is given', () => {
    render(<KeepyUppy xpNote="12 left today" />)
    expect(screen.getByText('12 left today')).toBeInTheDocument()
  })

  it('cancels its animation frame on unmount', () => {
    const { unmount } = render(<KeepyUppy />)
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })
})
