export default function StatPill({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-300',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }

  return (
    <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${tones[tone]}`} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-1 font-display text-2xl leading-none tracking-wide text-slate-100">{value}</p>
    </div>
  )
}
