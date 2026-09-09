import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import { MIN_PROOF_BYTES } from './lib/anticheat.js'

/** Build a File that passes (or deliberately fails) the anti-cheat checks. */
function makeFile({ name = 'clip.mp4', type = 'video/mp4', bytes = MIN_PROOF_BYTES * 40, age = 0 } = {}) {
  const file = new File([new Uint8Array(bytes)], name, { type })
  Object.defineProperty(file, 'lastModified', { value: Date.now() - age })
  return file
}

async function openDrill(user, name) {
  await user.click(screen.getByRole('button', { name: new RegExp(name) }))
  return screen.getByRole('dialog')
}

function fileInput(dialog) {
  return dialog.querySelector('input[type="file"]')
}

describe('FxcST app', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = () => ({
    // applyAccept:false mirrors reality — a desktop picker lets a user choose
    // "All files", so the accept attribute is a hint and our JS check is the gate.
    user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime, applyAccept: false }),
    ...render(<App />),
  })

  const profile = () => screen.getByRole('region', { name: 'Player profile' })

  it('renders the dashboard with the seeded level, XP and streak', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'You' })).toBeInTheDocument()
    expect(screen.getByText('LV 6')).toBeInTheDocument()
    expect(screen.getByText('320 / 1,650 XP')).toBeInTheDocument()
    expect(within(profile()).getByText('4,820')).toBeInTheDocument()
    expect(screen.getByLabelText('Level 6 progress')).toHaveAttribute('aria-valuenow', '320')
  })

  it('lists every drill and filters them by category', async () => {
    const { user } = setup()
    expect(screen.getByText('0/6 verified')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Recovery' }))
    expect(screen.getByText('Foam Rolling & Mobility')).toBeInTheDocument()
    expect(screen.queryByText('100 Wall Passes')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('100 Wall Passes')).toBeInTheDocument()
  })

  describe('anti-cheat gate', () => {
    it('offers no way to claim XP before proof is uploaded', async () => {
      const { user } = setup()
      const dialog = await openDrill(user, '100 Wall Passes')

      expect(within(dialog).getByText('Proof required')).toBeInTheDocument()
      expect(within(dialog).queryByRole('button', { name: /Claim/ })).not.toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: /Upload video proof/ })).toBeInTheDocument()
    })

    it('rejects a photo on a video drill and awards nothing', async () => {
      const { user } = setup()
      const dialog = await openDrill(user, '100 Wall Passes')

      await user.upload(fileInput(dialog), makeFile({ name: 'shot.png', type: 'image/png' }))

      expect(await within(dialog).findByText(/needs a video clip/)).toBeInTheDocument()
      expect(within(dialog).queryByRole('button', { name: /Submit/ })).not.toBeInTheDocument()
      expect(within(profile()).getByText('4,820')).toBeInTheDocument()
    })

    it('rejects proof recycled from more than a day ago', async () => {
      const { user } = setup()
      const dialog = await openDrill(user, '100 Wall Passes')

      await user.upload(fileInput(dialog), makeFile({ age: 3 * 24 * 60 * 60 * 1000 }))

      expect(await within(dialog).findByText(/last 24 hours/)).toBeInTheDocument()
    })

    it('rejects an empty placeholder file', async () => {
      const { user } = setup()
      const dialog = await openDrill(user, '100 Wall Passes')

      await user.upload(fileInput(dialog), makeFile({ bytes: 200 }))

      expect(await within(dialog).findByText(/too small/)).toBeInTheDocument()
    })
  })

  it('awards XP only after a valid proof clears verification', async () => {
    const { user } = setup()
    const dialog = await openDrill(user, '100 Wall Passes')

    await user.upload(fileInput(dialog), makeFile())

    // Reviewing the upload still does not release the XP.
    const submit = await within(dialog).findByRole('button', { name: /Submit for verification/ })
    expect(within(dialog).queryByRole('button', { name: /Claim/ })).not.toBeInTheDocument()

    await user.click(submit)
    expect(within(dialog).getByText('Verifying your proof')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Claim/ })).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(2000)
    const claim = await within(dialog).findByRole('button', { name: /Claim \+120 XP/ })
    await user.click(claim)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // 4,820 + 120
    expect(within(profile()).getByText('4,940')).toBeInTheDocument()
    expect(screen.getByText(/\+120 XP · 100 Wall Passes verified/)).toBeInTheDocument()
    expect(screen.getByText('1/6 verified')).toBeInTheDocument()
  })

  it('ticks the streak and session count on a first verified drill', async () => {
    const { user } = setup()
    expect(within(profile()).getByText('42')).toBeInTheDocument()

    const dialog = await openDrill(user, 'Foam Rolling')
    await user.upload(fileInput(dialog), makeFile({ name: 'roll.jpg', type: 'image/jpeg' }))
    await user.click(await within(dialog).findByRole('button', { name: /Submit/ }))
    await vi.advanceTimersByTimeAsync(2000)
    await user.click(await within(dialog).findByRole('button', { name: /Claim/ }))

    expect(within(profile()).getByText('43')).toBeInTheDocument() // sessions
    expect(within(profile()).getByText('7')).toBeInTheDocument() // streak, was 6
  })

  it('completes the matching daily quest when a recovery drill is verified', async () => {
    const { user } = setup()
    expect(screen.getByText('0/4')).toBeInTheDocument()

    const dialog = await openDrill(user, 'Foam Rolling')
    await user.upload(fileInput(dialog), makeFile({ name: 'roll.jpg', type: 'image/jpeg' }))
    await user.click(await within(dialog).findByRole('button', { name: /Submit/ }))
    await vi.advanceTimersByTimeAsync(2000)
    await user.click(await within(dialog).findByRole('button', { name: /Claim/ }))

    // The recovery quest and the streak quest both clear off one verified drill.
    expect(screen.getByText('2/4')).toBeInTheDocument()
    expect(screen.getByText('Finish a recovery session')).toHaveClass('line-through')
    expect(screen.getByText('Keep your streak alive today')).toHaveClass('line-through')
  })

  it('persists a verified run across a reload', async () => {
    const { user, unmount } = setup()
    const dialog = await openDrill(user, '100 Wall Passes')
    await user.upload(fileInput(dialog), makeFile())
    await user.click(await within(dialog).findByRole('button', { name: /Submit/ }))
    await vi.advanceTimersByTimeAsync(2000)
    await user.click(await within(dialog).findByRole('button', { name: /Claim/ }))

    unmount()
    render(<App />)
    expect(within(profile()).getByText('4,940')).toBeInTheDocument()
    expect(screen.getByText('1/6 verified')).toBeInTheDocument()
  })

  it('closes the proof sheet on Escape without awarding anything', async () => {
    const { user } = setup()
    await openDrill(user, '100 Wall Passes')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(profile()).getByText('4,820')).toBeInTheDocument()
  })
})

describe('leaderboard', () => {
  beforeEach(() => window.localStorage.clear())

  const setup = () => ({ user: userEvent.setup(), ...render(<App />) })

  const board = () => screen.getByRole('region', { name: 'Leaderboard' })

  it('ranks the player among rivals in their own town by default', () => {
    setup()
    expect(screen.getByText(/Your rank in/)).toBeInTheDocument()
    expect(screen.getByText('3rd')).toBeInTheDocument()
    expect(screen.getByText('Kayden O.')).toBeInTheDocument()
    expect(screen.queryByText('Tomasz W.')).not.toBeInTheDocument()
  })

  it('switches to another UK town and drops the player from the board', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Manchester' }))

    expect(screen.getByText('Tomasz W.')).toBeInTheDocument()
    expect(screen.queryByText('Kayden O.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Your rank in/)).not.toBeInTheDocument()
    expect(screen.getByText('3 players')).toBeInTheDocument()
  })

  it('shows every player on the All UK board, sorted by XP', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'All UK' }))

    expect(screen.getByText('27 players')).toBeInTheDocument()
    const names = within(board()).getAllByRole('listitem').map((li) => li.textContent)
    expect(names[0]).toMatch(/Tomasz W\./) // 8,120 — highest in the UK
  })

  it('remembers the selected town across a reload', async () => {
    const { user, unmount } = setup()
    await user.click(screen.getByRole('button', { name: 'Leeds' }))
    unmount()

    render(<App />)
    expect(screen.getByText('Ellis G.')).toBeInTheDocument()
  })
})

describe('arcade XP', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => vi.useRealTimers())

  /** Play the mini-game to a finished run by never tapping after the start. */
  function playUntilOut() {
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })))
    for (let i = 0; i < 200; i += 1) {
      const due = frameCallbacks
      frameCallbacks = []
      act(() => {
        for (const cb of due) cb((i + 1) * 32)
      })
    }
  }

  let frameCallbacks = []

  function stubCanvas() {
    frameCallbacks = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameCallbacks.push(cb)
      return frameCallbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        new Proxy(
          {},
          {
            get: (target, prop) =>
              prop in target
                ? target[prop]
                : () => (prop === 'createRadialGradient' ? { addColorStop: () => {} } : undefined),
            set: (target, prop, value) => {
              target[prop] = value
              return true
            },
          },
        ),
    )
  }

  it('states the daily cap and what is left of it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubCanvas()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByText(/up to 20 a day — 20 left today/)).toBeInTheDocument()
  })

  it('keeps a whole day of arcade XP below one verified drill', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubCanvas()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Play' }))
    // Bank the full daily allowance directly, then confirm the ceiling holds.
    for (let run = 0; run < 30; run += 1) playUntilOut()

    await user.click(screen.getByRole('button', { name: 'Home' }))
    const profile = screen.getByRole('region', { name: 'Player profile' })
    const xpText = within(profile).getByText(/^4,9|^4,8/).textContent
    const xp = Number(xpText.replace(/,/g, ''))

    // Seed XP is 4,820. The cheapest drill is 80 XP; a day of arcade is 20.
    expect(xp).toBeGreaterThanOrEqual(4820)
    expect(xp).toBeLessThanOrEqual(4840)
  })

  it('does not touch the streak or the verified-drill count', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubCanvas()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Play' }))
    playUntilOut()

    await user.click(screen.getByRole('button', { name: 'Home' }))
    const profile = screen.getByRole('region', { name: 'Player profile' })
    expect(within(profile).getByText('6')).toBeInTheDocument() // streak unchanged
    expect(screen.getByText('0/6 verified')).toBeInTheDocument()
  })
})
