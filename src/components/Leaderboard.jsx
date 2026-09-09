import { useMemo } from 'react'
import { Crown, Flame, MapPin, Medal, TrendingUp } from 'lucide-react'
import { RIVALS, TOWNS } from '../data/seed.js'
import { formatXp, levelFromXp, ordinal } from '../lib/game.js'

const MEDALS = ['text-amber-400', 'text-slate-300', 'text-orange-400']

function Row({ entry, position, isYou }) {
  const { level } = levelFromXp(entry.xp)

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        isYou
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-800/80 bg-slate-950/40'
      }`}
    >
      <span className="w-7 shrink-0 text-center">
        {position <= 3 ? (
          <Medal className={`mx-auto h-5 w-5 ${MEDALS[position - 1]}`} aria-hidden="true" />
        ) : (
          <span className="font-display text-lg tracking-wide text-slate-500">{position}</span>
        )}
      </span>

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
          isYou
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950'
            : 'bg-slate-800 text-slate-300'
        }`}
      >
        {entry.initials}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-100">
          {entry.name}
          {isYou && (
            <span className="rounded bg-emerald-500 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950">
              You
            </span>
          )}
          {position === 1 && <Crown className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />}
        </p>
        <p className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Lv {level}</span>
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {entry.town}
          </span>
          <span className="flex items-center gap-0.5 text-orange-400/80">
            <Flame className="h-3 w-3" aria-hidden="true" />
            {entry.streak}
          </span>
        </p>
      </div>

      <span className="shrink-0 font-display text-xl leading-none tracking-wide text-emerald-300">
        {formatXp(entry.xp)}
      </span>
    </li>
  )
}

export default function Leaderboard({ player, xp, streak, town, onTownChange }) {
  const { rows, yourPosition } = useMemo(() => {
    const you = {
      id: player.id,
      name: player.name,
      initials: player.initials,
      town: player.town,
      xp,
      streak,
    }

    const all = [...RIVALS, you]
    const filtered = town === 'All UK' ? all : all.filter((entry) => entry.town === town)
    const sorted = filtered.sort((a, b) => b.xp - a.xp)

    return {
      rows: sorted,
      yourPosition: sorted.findIndex((entry) => entry.id === player.id) + 1,
    }
  }, [player, xp, streak, town])

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h2 className="font-display text-xl tracking-wide">Leaderboard</h2>
        </div>
        <span className="text-xs text-slate-500">{rows.length} players</span>
      </header>

      {/* Town rail: the local board is the one that motivates, so it leads. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {TOWNS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onTownChange(option)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              option === town
                ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {yourPosition > 0 && (
        <div className="card flex items-center justify-between p-3">
          <p className="text-xs text-slate-400">
            Your rank in <span className="font-semibold text-slate-200">{town}</span>
          </p>
          <p className="font-display text-2xl leading-none tracking-wide text-amber-300">
            {ordinal(yourPosition)}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map((entry, index) => (
          <Row
            key={entry.id}
            entry={entry}
            position={index + 1}
            isYou={entry.id === player.id}
          />
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="card p-6 text-center text-sm text-slate-500">
          No players logged sessions in {town} yet. Be the first.
        </p>
      )}
    </section>
  )
}
