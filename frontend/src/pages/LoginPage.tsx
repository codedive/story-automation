import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { apiClient, getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  async function handleSuccess(credential: string | undefined) {
    if (!credential) {
      setError('Google did not return a credential. Please try again.')
      return
    }
    setError(null)
    try {
      const { data } = await apiClient.post('/api/auth/google', { id_token: credential })
      login(data.access_token, data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">AI Story Factory</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with the authorized Google account to continue.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => handleSuccess(credentialResponse.credential)}
            onError={() => setError('Google sign-in failed. Please try again.')}
          />
        </div>
      </div>
    </div>
  )
}
