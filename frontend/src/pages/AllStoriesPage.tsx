import { useEffect, useState } from 'react'
import { deleteStory, fetchAllStories, regenerateStory } from '../api/stories'
import { getErrorMessage } from '../api/client'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchBar from '../components/SearchBar'
import StoryTable from '../components/StoryTable'
import { useAiToggle } from '../context/AiToggleContext'
import type { StoryListItem } from '../types'

export default function AllStoriesPage() {
  const { aiEnabled, aiProvider } = useAiToggle()
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null)
  const [deletingStory, setDeletingStory] = useState<StoryListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllStories()
      setStories(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = stories.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.title.toLowerCase().includes(q) || (s.summary ?? '').toLowerCase().includes(q)
  })

  async function handleRegenerate(story: StoryListItem) {
    if (!aiEnabled) {
      setError('AI Generation is turned OFF (see the header toggle). Turn it on to regenerate stories.')
      return
    }
    setRegeneratingId(story.id)
    try {
      await regenerateStory(story.id, { ai_provider: aiProvider })
      await load()
    } finally {
      setRegeneratingId(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingStory) return
    setIsDeleting(true)
    try {
      await deleteStory(deletingStory.id)
      setDeletingStory(null)
      await load()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-bold text-slate-800">All Stories</h2>
      <p className="mt-1 text-sm text-slate-500">Browse every generated story across all categories.</p>

      <div className="my-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search all stories..." />
      </div>

      {loading && <LoadingSpinner label="Loading stories..." />}
      {!loading && error && <ErrorAlert message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No stories found" description="Generate stories from a category to see them here." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <StoryTable stories={filtered} regeneratingId={regeneratingId} onRegenerate={handleRegenerate} onDelete={setDeletingStory} />
      )}

      {deletingStory && (
        <DeleteConfirmationModal
          title="Delete Story"
          message={`Are you sure you want to delete "${deletingStory.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingStory(null)}
        />
      )}
    </div>
  )
}
