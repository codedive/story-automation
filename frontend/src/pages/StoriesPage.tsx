import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchCategory } from '../api/categories'
import { getErrorMessage } from '../api/client'
import { regenerateStory } from '../api/stories'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import ManualStoryForm from '../components/ManualStoryForm'
import SearchBar from '../components/SearchBar'
import StoryCard from '../components/StoryCard'
import StoryGeneratorModal from '../components/StoryGeneratorModal'
import StoryTable from '../components/StoryTable'
import { SORT_OPTIONS, STATUS_FILTER_OPTIONS } from '../constants'
import { useAiToggle } from '../context/AiToggleContext'
import { useStories } from '../hooks/useStories'
import type { Category, StoryListItem } from '../types'

export default function StoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const id = Number(categoryId)
  const navigate = useNavigate()
  const { aiEnabled, aiProvider } = useAiToggle()

  const [category, setCategory] = useState<Category | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [showGenerator, setShowGenerator] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [deletingStory, setDeletingStory] = useState<StoryListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const params = useMemo(() => ({ search: search || undefined, status: statusFilter, sort }), [search, statusFilter, sort])
  const { stories, loading, error, reload, remove } = useStories(id, params)

  useEffect(() => {
    fetchCategory(id)
      .then(setCategory)
      .catch((err) => setCategoryError(getErrorMessage(err)))
  }, [id])

  async function handleRegenerate(story: StoryListItem) {
    if (!aiEnabled) {
      setActionError('AI Generation is turned OFF (see the header toggle). Turn it on to regenerate stories.')
      return
    }
    setActionError(null)
    setRegeneratingId(story.id)
    try {
      await regenerateStory(story.id, { ai_provider: aiProvider })
      await reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setRegeneratingId(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingStory) return
    setIsDeleting(true)
    try {
      await remove(deletingStory.id)
      setDeletingStory(null)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        &larr; Categories
      </Link>

      <div className="mt-3 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{category?.name ?? 'Stories'}</h2>
          <p className="mt-1 text-sm text-slate-500">{stories.length} Stories</p>
        </div>
        {category && (
          <div className="flex shrink-0 gap-3">
            <button
              onClick={() => setShowManualForm(true)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              + ADD STORY MANUALLY
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              GENERATE NEW STORY
            </button>
          </div>
        )}
      </div>

      {categoryError && <ErrorAlert message={categoryError} />}
      {actionError && <div className="mb-4"><ErrorAlert message={actionError} /></div>}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search stories by title, summary, location..." />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  statusFilter === opt ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'oldest' | 'title')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner label="Loading stories..." />}
      {!loading && error && <ErrorAlert message={error} onRetry={reload} />}

      {!loading && !error && stories.length === 0 && (
        <EmptyState
          title="No stories yet"
          description="Generate your first story for this category."
          action={
            category && (
              <button
                onClick={() => setShowGenerator(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                GENERATE NEW STORY
              </button>
            )
          }
        />
      )}

      {!loading && !error && stories.length > 0 && (
        <>
          <div className="hidden md:block">
            <StoryTable
              stories={stories}
              regeneratingId={regeneratingId}
              onRegenerate={handleRegenerate}
              onDelete={setDeletingStory}
            />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                regenerating={regeneratingId === story.id}
                onRegenerate={handleRegenerate}
                onDelete={setDeletingStory}
              />
            ))}
          </div>
        </>
      )}

      {showGenerator && category && (
        <StoryGeneratorModal
          category={category}
          onClose={() => setShowGenerator(false)}
          onGenerated={(story) => {
            setShowGenerator(false)
            reload()
            navigate(`/stories/${story.id}`)
          }}
        />
      )}

      {showManualForm && category && (
        <ManualStoryForm
          categoryId={category.id}
          onClose={() => setShowManualForm(false)}
          onCreated={(story) => {
            setShowManualForm(false)
            reload()
            navigate(`/stories/${story.id}`)
          }}
        />
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
