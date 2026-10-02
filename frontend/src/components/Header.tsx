import { AI_PROVIDER_OPTIONS } from '../constants'
import { useAiToggle } from '../context/AiToggleContext'
import { useAuth } from '../context/AuthContext'
import type { AIProviderOption } from '../types'

export default function Header() {
  const { aiEnabled, setAiEnabled, aiProvider, setAiProvider } = useAiToggle()
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-xl font-bold text-slate-800">AI Story Factory</h1>
      <div className="flex items-center gap-3">
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value as AIProviderOption)}
          title="Choose which AI provider generates stories"
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          {AI_PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAiEnabled(!aiEnabled)}
          title={aiEnabled ? 'Click to disable AI calls (prevents OpenAI usage/costs)' : 'Click to re-enable AI calls'}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            aiEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          AI Generation: {aiEnabled ? 'ON' : 'OFF'}
        </button>
        {user && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            {user.picture && (
              <img src={user.picture} alt={user.name ?? user.email} className="h-7 w-7 rounded-full" />
            )}
            <span className="hidden text-xs font-medium text-slate-600 sm:inline">{user.name ?? user.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
