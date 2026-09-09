import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Filter } from 'lucide-react'
import LevelCard from './components/LevelCard.jsx'
import QuestBoard from './components/QuestBoard.jsx'
import ExerciseCard from './components/ExerciseCard.jsx'
import ProofModal from './components/ProofModal.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import TabBar from './components/TabBar.jsx'
import KeepyUppy from './components/KeepyUppy.jsx'
import XpToast from './components/XpToast.jsx'
import { CATEGORIES, EXERCISES, PLAYER, QUESTS } from './data/seed.js'
import { levelFromXp, loadProgress, saveProgress } from './lib/game.js'
import { awardForRun, DAILY_CAP, today } from './lib/arcade.js'

const INITIAL_PROGRESS = {
  xp: PLAYER.xp,
  streak: PLAYER.streak,
  sessions: PLAYER.sessions,
  completed: [],
  town: PLAYER.town,
  /** Arcade XP is capped per day; these two track that day's allowance. */
  arcadeXpDate: null,
  arcadeXpEarned: 0,
}

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress(INITIAL_PROGRESS))
  const [tab, setTab] = useState('home')
  const [category, setCategory] = useState('all')
  const [openExercise, setOpenExercise] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const visibleExercises = useMemo(
    () =>
      category === 'all'
        ? EXERCISES
        : EXERCISES.filter((exercise) => exercise.category === category),
    [category],
  )

  /** Quest progress reacts to what has actually been verified this session. */
  const quests = useMemo(() => {
    const completed = new Set(progress.completed)
    const didRecovery = EXERCISES.some(
      (exercise) => exercise.category === 'recovery' && completed.has(exercise.id),
    )
    const didWeakFoot = completed.has('weak-foot-volleys') || completed.has('wall-passes-100')

    return QUESTS.map((quest) => {
      if (quest.id === 'q-recovery') return { ...quest, progress: didRecovery ? 1 : 0 }
      if (quest.id === 'q-weak-foot') return { ...quest, progress: didWeakFoot ? 1 : 0 }
      if (quest.id === 'q-streak') return { ...quest, progress: completed.size > 0 ? 1 : 0 }
      if (quest.id === 'q-touches') {
        return { ...quest, progress: quest.progress + completed.size * 30 }
      }
      return quest
    })
  }, [progress.completed])

  /**
   * Only ever called once the proof modal reports a verified upload — this is
   * the single place XP enters the system.
   */
  const awardXp = useCallback(
    (exercise) => {
      const alreadyDone = progress.completed.includes(exercise.id)
      const beforeLevel = levelFromXp(progress.xp).level
      const nextXp = progress.xp + exercise.xp
      const afterLevel = levelFromXp(nextXp).level

      setProgress({
        ...progress,
        xp: nextXp,
        sessions: progress.sessions + 1,
        // The streak only ticks the first time a drill is banked.
        streak: alreadyDone ? progress.streak : progress.streak + 1,
        completed: alreadyDone ? progress.completed : [...progress.completed, exercise.id],
      })

      setToast(
        afterLevel > beforeLevel
          ? `Level ${afterLevel} unlocked! +${exercise.xp} XP`
          : `+${exercise.xp} XP · ${exercise.title} verified`,
      )
    },
    [progress],
  )

  /**
   * A finished arcade run. The cap in lib/arcade.js is what stops the
   * mini-game distorting a leaderboard that is meant to be earned by training.
   */
  const finishRun = useCallback(
    (score) => {
      const result = awardForRun(score, progress)

      setProgress({
        ...progress,
        xp: progress.xp + result.xp,
        arcadeXpDate: result.arcadeXpDate,
        arcadeXpEarned: result.arcadeXpEarned,
      })

      if (result.xp > 0) {
        setToast(`+${result.xp} XP · ${score} defenders beaten`)
      } else if (result.cappedOut) {
        setToast(`Daily arcade cap reached — train to keep earning XP`)
      }
    },
    [progress],
  )

  const arcadeRemaining =
    progress.arcadeXpDate === today() ? Math.max(0, DAILY_CAP - progress.arcadeXpEarned) : DAILY_CAP

  const setTown = useCallback((town) => {
    setProgress((current) => ({ ...current, town }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const showHome = tab === 'home'
  const showTrain = tab === 'home' || tab === 'train'
  const showRanks = tab === 'home' || tab === 'ranks'
  const showPlay = tab === 'play'

  return (
    <div className="min-h-screen pb-24">
      <XpToast toast={toast} onDismiss={dismissToast} />

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        <header className="flex items-center justify-between">
          <p className="font-display text-2xl tracking-[0.2em] text-emerald-400">FXCST</p>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Proof verified training
          </span>
        </header>

        {showHome && (
          <LevelCard
            player={PLAYER}
            xp={progress.xp}
            streak={progress.streak}
            sessions={progress.sessions}
            verifiedRate={PLAYER.verifiedRate}
          />
        )}

        {showHome && <QuestBoard quests={quests} />}

        {showTrain && (
          <section className="space-y-3" aria-label="Training drills">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <h2 className="font-display text-xl tracking-wide">Training Drills</h2>
              </div>
              <span className="text-xs text-slate-500">
                {progress.completed.length}/{EXERCISES.length} verified
              </span>
            </header>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
              {CATEGORIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    option.id === category
                      ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {visibleExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  completed={progress.completed.includes(exercise.id)}
                  onOpen={setOpenExercise}
                />
              ))}
            </div>
          </section>
        )}

        {showPlay && (
          <KeepyUppy
            onRunEnd={finishRun}
            xpNote={
              arcadeRemaining > 0
                ? `Each defender beaten is 1 XP, up to ${DAILY_CAP} a day — ${arcadeRemaining} left today. Training is still where the real XP is.`
                : `You have taken today's ${DAILY_CAP} arcade XP. Play on for the high score, or train to keep earning.`
            }
          />
        )}

        {showRanks && (
          <Leaderboard
            player={PLAYER}
            xp={progress.xp}
            streak={progress.streak}
            town={progress.town}
            onTownChange={setTown}
          />
        )}

        <p className="pb-2 text-center text-[11px] text-slate-600">
          Every drill is XP-locked until your proof clears verification.
        </p>
      </div>

      {openExercise && (
        <ProofModal
          exercise={openExercise}
          completed={progress.completed.includes(openExercise.id)}
          onClose={() => setOpenExercise(null)}
          onVerified={awardXp}
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
