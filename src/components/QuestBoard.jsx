import { Check, Swords } from 'lucide-react'

export default function QuestBoard({ quests }) {
  const done = quests.filter((q) => q.progress >= q.target).length

  return (
    <section className="card p-4" aria-label="Daily quests">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <h2 className="font-display text-xl tracking-wide">Daily Quests</h2>
        </div>
        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
          {done}/{quests.length}
        </span>
      </header>

      <ul className="space-y-2.5">
        {quests.map((quest) => {
          const complete = quest.progress >= quest.target
          const pct = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <li
              key={quest.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    complete
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                  aria-hidden="true"
                >
                  {complete && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <p
                  className={`flex-1 text-sm font-medium ${
                    complete ? 'text-slate-500 line-through' : 'text-slate-200'
                  }`}
                >
                  {quest.label}
                </p>
                <span className="shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                  +{quest.xp}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 pl-[30px]">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      complete ? 'bg-emerald-500' : 'bg-emerald-500/60'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-[10px] tabular-nums text-slate-500">
                  {Math.min(quest.progress, quest.target)}/{quest.target} {quest.unit}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
