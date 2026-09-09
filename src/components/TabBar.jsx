import { Home, Dumbbell, Trophy, Gamepad2 } from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'play', label: 'Play', icon: Gamepad2 },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === active

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
