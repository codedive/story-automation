import { useNavigate } from 'react-router-dom'
import type { CategorySummary } from '../types'

interface CategoryCardProps {
  category: CategorySummary
  onEdit: (category: CategorySummary) => void
  onDelete: (category: CategorySummary) => void
}

function formatDate(value: string | null): string {
  if (!value) return 'Never'
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{category.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{category.description || 'No description provided.'}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Stories: <strong className="text-slate-700">{category.story_count}</strong></span>
          <span>Last Generated: <strong className="text-slate-700">{formatDate(category.last_generated_at)}</strong></span>
          <span>Created: <strong className="text-slate-700">{formatDate(category.created_at)}</strong></span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => navigate(`/categories/${category.id}/stories`)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Open Stories
        </button>
        <div className="flex gap-2 text-sm font-medium">
          <button onClick={() => onEdit(category)} className="text-slate-500 hover:text-indigo-600">
            Edit
          </button>
          <button onClick={() => onDelete(category)} className="text-slate-500 hover:text-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
