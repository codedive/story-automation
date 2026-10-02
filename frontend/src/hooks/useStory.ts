import { useCallback, useEffect, useState } from 'react'
import { deleteStory, fetchStory, regenerateStory, updateStory } from '../api/stories'
import { getErrorMessage } from '../api/client'
import { useAiToggle } from '../context/AiToggleContext'
import type { Story, StoryUpdateInput } from '../types'

export function useStory(id: number) {
  const { aiProvider } = useAiToggle()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStory(id)
      setStory(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function update(input: StoryUpdateInput) {
    const updated = await updateStory(id, input)
    setStory(updated)
    return updated
  }

  async function regenerate() {
    const updated = await regenerateStory(id, { ai_provider: aiProvider })
    setStory(updated)
    return updated
  }

  async function remove() {
    await deleteStory(id)
  }

  return { story, loading, error, reload: load, update, regenerate, remove, setStory }
}
