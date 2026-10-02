export default function SettingsPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
      <p className="mt-1 text-sm text-slate-500">Application configuration overview.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">API Base URL</dt>
            <dd className="text-slate-800">{apiBaseUrl}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">OpenAI API Key</dt>
            <dd className="text-slate-800">Configured in backend/.env (OPENAI_API_KEY). Never exposed to the frontend.</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Model</dt>
            <dd className="text-slate-800">Configurable via backend/.env (OPENAI_MODEL).</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Duplicate Threshold</dt>
            <dd className="text-slate-800">Configurable via backend/.env (DUPLICATE_THRESHOLD), default 72%.</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
