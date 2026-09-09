import { ChevronRight, Clock, Video, Camera, CheckCircle2, Lock } from 'lucide-react'
import { CATEGORY_STYLES } from '../data/seed.js'

export default function ExerciseCard({ exercise, completed, onOpen }) {
  const style = CATEGORY_STYLES[exercise.category]
  const Icon = exercise.icon
  const ProofIcon = exercise.proof === 'photo' ? Camera : Video

  return (
    <button
      type="button"
      onClick={() => onOpen(exercise)}
      className={`group card w-full p-4 text-left transition-colors ${style.glow} ${
        completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/70">
          <Icon className={`h-5 w-5 ${style.icon}`} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-100">{exercise.title}</h3>
            {completed && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Completed" />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{exercise.summary}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}
            >
              {style.label}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-slate-800/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {exercise.duration}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-slate-800/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              {completed ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Lock className="h-3 w-3" aria-hidden="true" />
              )}
              <ProofIcon className="h-3 w-3" aria-hidden="true" />
              {exercise.proof === 'photo' ? 'Photo proof' : 'Video proof'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-display text-lg leading-none tracking-wide text-amber-300">
            +{exercise.xp}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </button>
  )
}
