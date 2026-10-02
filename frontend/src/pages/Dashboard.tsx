import { useState } from 'react'
import CategoryCard from '../components/CategoryCard'
import CategoryForm from '../components/CategoryForm'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import { useCategories } from '../hooks/useCategories'
import type { CategorySummary } from '../types'

export default function Dashboard() {
  const { categories, loading, error, reload, create, update, remove } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategorySummary | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategorySummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function openCreateForm() {
    setEditingCategory(null)
    setShowForm(true)
  }

  function openEditForm(category: CategorySummary) {
    setEditingCategory(category)
    setShowForm(true)
  }

  async function handleFormSubmit(input: Parameters<typeof create>[0]) {
    if (editingCategory) {
      await update(editingCategory.id, input)
    } else {
      await create(input)
    }
    setShowForm(false)
  }

  async function handleDeleteConfirm() {
    if (!deletingCategory) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await remove(deletingCategory.id)
      setDeletingCategory(null)
    } catch {
      setDeleteError('Failed to delete category. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Story Factory</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, organize and generate unique stories for your content channels.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Add New Category
        </button>
      </div>

      {loading && <LoadingSpinner label="Loading categories..." />}
      {!loading && error && <ErrorAlert message={error} onRetry={reload} />}

      {!loading && !error && categories.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Create your first category to start generating stories for a content niche."
          action={
            <button
              onClick={openCreateForm}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Add New Category
            </button>
          }
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={openEditForm}
              onDelete={setDeletingCategory}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CategoryForm initial={editingCategory} onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />
      )}

      {deletingCategory && (
        <DeleteConfirmationModal
          title="Delete Category"
          message={
            deletingCategory.story_count > 0
              ? `This category contains ${deletingCategory.story_count} stories. Deleting it will also delete its stories. Are you sure you want to delete "${deletingCategory.name}"?`
              : `Are you sure you want to delete "${deletingCategory.name}"?`
          }
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeletingCategory(null)
            setDeleteError(null)
          }}
        />
      )}
      {deleteError && <div className="mt-4"><ErrorAlert message={deleteError} /></div>}
    </div>
  )
}
