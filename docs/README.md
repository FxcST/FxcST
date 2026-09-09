# FxcST — Football Training & Leaderboard

A gamified training app for youth and teen footballers. Players work through
drills, upload proof that they actually did them, and climb the leaderboard for
their own UK town.

> Project docs live here rather than in the root `README.md`, because that file
> is this repository's GitHub **profile** README.

## Stack

- React 19 + Vite
- Tailwind CSS 3
- lucide-react icons
- Dark UI: Slate-950 base, Emerald accents, Amber highlight badges

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # serve the build
npm run lint     # oxlint
npm test         # vitest, single run
npm run test:watch
```

## Features

### Gamified dashboard
`src/components/LevelCard.jsx` — level badge, XP progress bar towards the next
level, lifetime XP, session count, verified-proof rate, and a day-streak flame.
The level curve lives in `src/lib/game.js` (`xpForLevel`, `levelFromXp`) and
maps levels onto ranks: Rookie → Prospect → Starter → Playmaker → Captain →
Elite.

### Daily quests
`src/components/QuestBoard.jsx` — a rotating quest board with per-quest progress
bars and XP rewards. Quest progress is derived from what the player has actually
verified, so completing a recovery drill ticks the recovery quest.

### Anti-cheat proof gate
`src/components/ProofModal.jsx` — **no XP is awarded without proof.** Opening a
drill shows the brief and its steps, but the only way forward is uploading a
photo or video. `inspectProof()` in `src/lib/anticheat.js` runs the local checks
before submission:

| Check | Rule |
| --- | --- |
| Media type | A video drill rejects photos outright |
| File size | Under 12 KB is treated as a placeholder, not a rep |
| Capture age | `lastModified` older than 24 hours is rejected as recycled |

Only after the upload passes and clears verification does the *Claim XP* button
appear, and `awardXp()` in `src/App.jsx` is the single place XP enters state.

### Location-based competition
`src/components/Leaderboard.jsx` — a horizontally scrolling rail of UK towns
(London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Newcastle,
Sheffield, Nottingham, Glasgow, Cardiff) plus an All-UK board. The player is
ranked in-place among rivals from the selected town, with their own position
called out above the table.

### Keepy Uppy mini-game
`src/components/KeepyUppy.jsx` — a one-tap arcade loop in the Flappy Bird
family, on the **Play** tab. Tap (or press space) to kick the ball upward and
thread the gap between defenders; one touch ends the run. It gets faster and
tighter the longer you last, and your best score persists.

The rules live in `src/game/engine.js` as a plain state object stepped by a
delta time, with no canvas, DOM or timers — so the physics, scoring and
difficulty curve are all unit-testable without a browser.
`src/game/render.js` draws a frame; `KeepyUppy.jsx` owns input and the
animation loop.

Two tuning decisions worth knowing:

- **Difficulty was tuned against a bot, not by feel.** A frame-perfect
  autopilot capped at 19 points under the first numbers, which meant the ramp
  beat skill rather than rewarding it. It now reaches roughly 40, so a strong
  human run is 10–25 and the board stays contestable.
- **`maxGapShift` caps how far a gap can move from the previous one.** Without
  it the RNG can place consecutive gaps at opposite ends of the pitch with no
  reachable path between them, which reads as the game cheating rather than as
  difficulty.

**Arcade XP is capped per day.** Each defender beaten is worth 1 XP, up to 20 a
day (`src/lib/arcade.js`). The cap is the whole point: tapping a screen is not
proof of training, so a player who only ever plays the game gains less in a
whole day than one verified recovery drill is worth (80 XP). That keeps the
mini-game rewarding without letting it distort a leaderboard meant to be earned
on the pitch. The allowance resets at the player's local midnight, and the
game's own best score lives under `fxcst.arcade.best.v1`.

Arcade runs never touch the streak, the session count or the verified-drill
tally — those stay proof-only.

### Drills
Six drills across three disciplines, in `src/data/seed.js`:

- **Technical** — 100 Wall Passes, Cone Dribbling Gauntlet, Weak Foot Volleys
- **Fitness** — 15-min Core Routine, Sprint Intervals
- **Recovery** — Foam Rolling & Mobility

## Tests

133 tests across six suites, run with `npm test`:

- `src/lib/game.test.js` — the XP curve and level resolution (thresholds,
  remainder carry-over, monotonicity, the seeded player's exact position),
  rank bands, ordinals, and localStorage persistence including corrupt and
  blocked storage.
- `src/lib/anticheat.test.js` — every accept and reject path of `inspectProof`,
  both boundaries (a file exactly on the size threshold, proof exactly 24 hours
  old), check ordering, and the ok/message invariant.
- `src/game/engine.test.js` — the mini-game's physics and rules: the RNG's
  determinism, the difficulty curve's monotonicity and clamps, ceiling and
  ground behaviour, oversized-frame clamping (so a backgrounded tab cannot
  tunnel the ball through a defender), circle-rectangle collision at the
  corners, scoring exactly once per wall, and a bot playthrough asserting every
  seed stays both fair and hard.
- `src/lib/arcade.test.js` — the daily XP cap: clipping a big run to what is
  left, paying nothing once spent, resetting on a new day, and an invariant
  that no number of runs can ever beat the cap.
- `src/components/KeepyUppy.test.jsx` — the game's React wiring against a
  stubbed canvas and hand-driven animation frames: input by pointer and by key,
  the ready/dead lifecycle, best-score persistence, and that playing never
  touches the training progress key.
- `src/App.test.jsx` — the app end to end in jsdom: that no claim button exists
  before a proof clears, that each rejection awards nothing, that XP, streak,
  session count, quest state and leaderboard position all move together on a
  verified drill, that progress survives a reload, and that the town filter
  re-ranks the board.

The app tests use `applyAccept: false` deliberately: a desktop file picker lets
a user choose "All files", so the `accept` attribute is only a hint and the
JavaScript check is the real gate — the tests exercise it the way a cheat would.

## Layout

```
src/
  App.jsx              tab shell, drill filtering, XP awarding
  lib/game.js          level curve, ranks, ordinals, localStorage persistence
  lib/anticheat.js     proof inspection rules
  lib/arcade.js        daily-capped arcade XP
  game/engine.js       mini-game rules and physics (no DOM)
  game/render.js       canvas drawing for the mini-game
  data/seed.js         drills, quests, towns, player and rival records
  components/
    LevelCard.jsx      level, XP bar, streak, stats
    QuestBoard.jsx     daily quests
    ExerciseCard.jsx   drill list item
    ProofModal.jsx     drill brief + anti-cheat upload flow
    Leaderboard.jsx    town filter + rankings
    KeepyUppy.jsx      the mini-game: canvas, input, animation loop
    TabBar.jsx         Home / Train / Play / Ranks
    XpToast.jsx        XP and level-up notifications
```

Progress persists to `localStorage` under `fxcst.progress.v1`, and falls back to
the seed data when storage is unavailable.
