import { Flame, Zap, ShieldCheck, CalendarDays, MapPin } from 'lucide-react'
import StatPill from './StatPill.jsx'
import { formatXp, levelFromXp, rankForLevel } from '../lib/game.js'

export default function LevelCard({ player, xp, streak, sessions, verifiedRate }) {
  const { level, xpIntoLevel, xpForNext, progress, xpRemaining } = levelFromXp(xp)
  const rank = rankForLevel(level)

  return (
    <section className="card overflow-hidden" aria-label="Player profile">
      <div className="relative p-5">
        {/* Soft pitch-light wash behind the identity block. */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-emerald-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-display text-2xl tracking-wider text-slate-950">
              {player.initials}
            </div>
            <span className="absolute -bottom-2 -right-2 rounded-lg border border-amber-400/40 bg-amber-400 px-1.5 py-0.5 font-display text-sm leading-none tracking-wide text-slate-950">
              LV {level}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-3xl leading-none tracking-wide">
                {player.name}
              </h1>
              <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {rank}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-400">
              {player.position} · {player.club}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {player.town}, UK
            </p>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2">
            <Flame
              className="h-6 w-6 text-orange-400 animate-flicker"
              aria-hidden="true"
            />
            <span className="mt-0.5 font-display text-xl leading-none text-orange-300">
              {streak}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-orange-400/80">
              day streak
            </span>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {formatXp(xpIntoLevel)} / {formatXp(xpForNext)} XP
            </span>
            <span className="text-slate-500">{formatXp(xpRemaining)} XP to level {level + 1}</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={xpForNext}
            aria-valuenow={xpIntoLevel}
            aria-label={`Level ${level} progress`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(progress * 100, 3)}%` }}
            />
          </div>
        </div>

        <div className="relative mt-4 flex gap-2">
          <StatPill icon={Zap} label="Total XP" value={formatXp(xp)} tone="emerald" />
          <StatPill icon={CalendarDays} label="Sessions" value={sessions} />
          <StatPill
            icon={ShieldCheck}
            label="Verified"
            value={`${Math.round(verifiedRate * 100)}%`}
            tone="amber"
          />
        </div>
      </div>
    </section>
  )
}
