import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AIProviderOption } from '../types'

const ENABLED_STORAGE_KEY = 'ai-story-factory:ai-enabled'
const PROVIDER_STORAGE_KEY = 'ai-story-factory:ai-provider'

interface AiToggleContextValue {
  aiEnabled: boolean
  setAiEnabled: (enabled: boolean) => void
  aiProvider: AIProviderOption
  setAiProvider: (provider: AIProviderOption) => void
}

const AiToggleContext = createContext<AiToggleContextValue | undefined>(undefined)

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(ENABLED_STORAGE_KEY)
  return stored === null ? true : stored === 'true'
}

function readInitialProvider(): AIProviderOption {
  if (typeof window === 'undefined') return 'openai'
  const stored = window.localStorage.getItem(PROVIDER_STORAGE_KEY)
  return stored === 'ollama' ? 'ollama' : 'openai'
}

export function AiToggleProvider({ children }: { children: ReactNode }) {
  const [aiEnabled, setAiEnabled] = useState(readInitialEnabled)
  const [aiProvider, setAiProvider] = useState<AIProviderOption>(readInitialProvider)

  useEffect(() => {
    window.localStorage.setItem(ENABLED_STORAGE_KEY, String(aiEnabled))
  }, [aiEnabled])

  useEffect(() => {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, aiProvider)
  }, [aiProvider])

  return (
    <AiToggleContext.Provider value={{ aiEnabled, setAiEnabled, aiProvider, setAiProvider }}>
      {children}
    </AiToggleContext.Provider>
  )
}

export function useAiToggle(): AiToggleContextValue {
  const ctx = useContext(AiToggleContext)
  if (!ctx) throw new Error('useAiToggle must be used within an AiToggleProvider')
  return ctx
}
