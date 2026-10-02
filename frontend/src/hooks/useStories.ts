import { useCallback, useEffect, useState } from 'react'
import { deleteStory, fetchStories, type StoryListParams } from '../api/stories'
import { getErrorMessage } from '../api/client'
import type { StoryListItem } from '../types'

export function useStories(categoryId: number, params: StoryListParams) {
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStories(categoryId, params)
      setStories(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, params.search, params.status, params.sort])

  useEffect(() => {
    load()
  }, [load])

  async function remove(id: number) {
    await deleteStory(id)
    await load()
  }

  return { stories, loading, error, reload: load, remove }
}
