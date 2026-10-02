import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import StoryDetail from '../components/StoryDetail'
import { useStory } from '../hooks/useStory'
import { useState } from 'react'
import type { Scene } from '../types'

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const id = Number(storyId)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { story, loading, error, reload, update, regenerate, remove, setStory } = useStory(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDeleteConfirm() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await remove()
      navigate(story ? `/categories/${story.category_id}/stories` : '/')
    } catch {
      setDeleteError('Failed to delete story. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSceneUpdated(scene: Scene) {
    if (!story) return
    setStory({ ...story, scenes: story.scenes.map((s) => (s.id === scene.id ? scene : s)) })
  }

  return (
    <div className="mx-auto max-w-4xl">
      {story && (
        <Link to={`/categories/${story.category_id}/stories`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          &larr; Back to Stories
        </Link>
      )}

      <div className="mt-4">
        {loading && <LoadingSpinner label="Loading story..." />}
        {!loading && error && <ErrorAlert message={error} onRetry={reload} />}
        {!loading && deleteError && <ErrorAlert message={deleteError} />}

        {!loading && story && (
          <StoryDetail
            story={story}
            onSave={async (input) => {
              await update(input)
            }}
            onRegenerate={async () => {
              await regenerate()
            }}
            onDelete={() => setShowDeleteModal(true)}
            onSceneUpdated={handleSceneUpdated}
            initialEdit={searchParams.get('edit') === '1'}
          />
        )}
      </div>

      {showDeleteModal && story && (
        <DeleteConfirmationModal
          title="Delete Story"
          message={`Are you sure you want to delete "${story.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
