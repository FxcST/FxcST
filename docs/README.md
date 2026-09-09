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
photo or video. `inspectProof()` runs the local checks before submission:

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

### Drills
Six drills across three disciplines, in `src/data/seed.js`:

- **Technical** — 100 Wall Passes, Cone Dribbling Gauntlet, Weak Foot Volleys
- **Fitness** — 15-min Core Routine, Sprint Intervals
- **Recovery** — Foam Rolling & Mobility

## Layout

```
src/
  App.jsx              tab shell, drill filtering, XP awarding
  lib/game.js          level curve, ranks, ordinals, localStorage persistence
  data/seed.js         drills, quests, towns, player and rival records
  components/
    LevelCard.jsx      level, XP bar, streak, stats
    QuestBoard.jsx     daily quests
    ExerciseCard.jsx   drill list item
    ProofModal.jsx     drill brief + anti-cheat upload flow
    Leaderboard.jsx    town filter + rankings
    TabBar.jsx         Home / Train / Ranks
    XpToast.jsx        XP and level-up notifications
```

Progress persists to `localStorage` under `fxcst.progress.v1`, and falls back to
the seed data when storage is unavailable.
