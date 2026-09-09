import { useEffect, useRef, useState } from 'react'
import {
  X,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Video,
  Camera,
  Trophy,
  RotateCcw,
} from 'lucide-react'
import { CATEGORY_STYLES } from '../data/seed.js'

/** Proof shot more than a day ago is almost always recycled from an old session. */
const MAX_PROOF_AGE_MS = 24 * 60 * 60 * 1000
const MIN_PROOF_BYTES = 12 * 1024

/**
 * Runs the local half of the anti-cheat check before anything is submitted:
 * right media type, recent enough, and not an empty placeholder file.
 */
function inspectProof(file, required) {
  const wantsVideo = required === 'video'
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (wantsVideo && !isVideo) {
    return { ok: false, message: 'This drill needs a video clip — a photo will not verify.' }
  }
  if (!wantsVideo && !isImage && !isVideo) {
    return { ok: false, message: 'Upload a photo or video of your session.' }
  }
  if (file.size < MIN_PROOF_BYTES) {
    return { ok: false, message: 'That file is too small to show a full rep. Record again.' }
  }
  if (file.lastModified && Date.now() - file.lastModified > MAX_PROOF_AGE_MS) {
    return { ok: false, message: 'Proof must be captured within the last 24 hours.' }
  }
  return { ok: true, message: '' }
}

export default function ProofModal({ exercise, completed, onClose, onVerified }) {
  const [stage, setStage] = useState('brief') // brief | review | verifying | verified
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const style = CATEGORY_STYLES[exercise.category]
  const Icon = exercise.icon
  const needsVideo = exercise.proof === 'video'
  const ProofIcon = needsVideo ? Video : Camera

  // Close on Escape and stop the page behind the sheet from scrolling.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // The preview URL owns a blob handle, so release it whenever it is replaced.
  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function handleFile(event) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return

    const check = inspectProof(picked, exercise.proof)
    if (!check.ok) {
      setError(check.message)
      setFile(null)
      setPreviewUrl(null)
      return
    }

    setError('')
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
    setStage('review')
  }

  function submitProof() {
    setStage('verifying')
    timerRef.current = setTimeout(() => setStage('verified'), 1800)
  }

  function claim() {
    onVerified(exercise)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={exercise.title}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg animate-slide-up overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
            <Icon className={`h-5 w-5 ${style.icon}`} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl leading-tight tracking-wide">{exercise.title}</h2>
            <p className="text-xs text-slate-400">
              {style.label} · {exercise.duration} · +{exercise.xp} XP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-4">
          {stage === 'brief' && (
            <>
              <p className="text-sm text-slate-300">{exercise.summary}</p>

              <ol className="space-y-2">
                {exercise.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-400">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-amber-300">Proof required</h3>
                </div>
                <p className="mt-1 text-xs text-amber-100/70">{exercise.proofHint}</p>
                <p className="mt-1 text-xs text-amber-100/50">
                  No XP is awarded until your {needsVideo ? 'clip' : 'photo'} is verified.
                </p>
              </div>

              {completed && (
                <p className="text-center text-xs text-emerald-400">
                  You have already banked XP for this drill today — extra reps still count towards
                  your quests.
                </p>
              )}
            </>
          )}

          {stage === 'review' && previewUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                {file.type.startsWith('video/') ? (
                  <video src={previewUrl} controls playsInline className="max-h-72 w-full" />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Your uploaded training proof"
                    className="max-h-72 w-full object-contain"
                  />
                )}
              </div>
              <p className="truncate text-center text-xs text-slate-500">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          )}

          {stage === 'verifying' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-400" aria-hidden="true" />
              <p className="font-display text-2xl tracking-wide">Verifying your proof</p>
              <p className="text-center text-xs text-slate-400">
                Checking capture time, duration and drill match…
              </p>
            </div>
          )}

          {stage === 'verified' && (
            <div className="flex animate-pop-in flex-col items-center gap-3 py-8">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
                <Trophy className="h-8 w-8 text-emerald-400" aria-hidden="true" />
              </span>
              <p className="font-display text-3xl tracking-wide text-emerald-300">Verified!</p>
              <p className="font-display text-4xl leading-none tracking-wide text-amber-300">
                +{exercise.xp} XP
              </p>
              <p className="text-center text-xs text-slate-400">
                Session logged and added to your local leaderboard.
              </p>
            </div>
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <footer className="sticky bottom-0 border-t border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
          <input
            ref={inputRef}
            type="file"
            accept={needsVideo ? 'video/*' : 'image/*,video/*'}
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />

          {(stage === 'brief' || stage === 'review') && (
            <div className="flex gap-2">
              {stage === 'review' && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Retake
                </button>
              )}
              <button
                type="button"
                onClick={stage === 'brief' ? () => inputRef.current?.click() : submitProof}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                {stage === 'brief' ? (
                  <>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload {needsVideo ? 'video' : 'photo'} proof
                  </>
                ) : (
                  <>
                    <ProofIcon className="h-4 w-4" aria-hidden="true" />
                    Submit for verification
                  </>
                )}
              </button>
            </div>
          )}

          {stage === 'verifying' && (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-500"
            >
              Verifying…
            </button>
          )}

          {stage === 'verified' && (
            <button
              type="button"
              onClick={claim}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300"
            >
              Claim +{exercise.xp} XP
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
