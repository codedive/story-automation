import { useNavigate } from 'react-router-dom'
import { useAiToggle } from '../context/AiToggleContext'
import type { StoryListItem } from '../types'
import SimilarityBadge from './SimilarityBadge'
import StatusBadge from './StatusBadge'

interface StoryTableProps {
  stories: StoryListItem[]
  regeneratingId: number | null
  onRegenerate: (story: StoryListItem) => void
  onDelete: (story: StoryListItem) => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function StoryTable({ stories, regeneratingId, onRegenerate, onDelete }: StoryTableProps) {
  const navigate = useNavigate()
  const { aiEnabled } = useAiToggle()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Story #</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Summary</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Similarity</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {stories.map((story) => (
            <tr key={story.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-500">#{story.episode_number}</td>
              <td className="max-w-[220px] px-4 py-3 font-semibold text-slate-800">{story.title}</td>
              <td className="max-w-[320px] px-4 py-3 text-slate-500">
                <span className="line-clamp-2">{story.summary}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(story.created_at)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={story.status} />
              </td>
              <td className="px-4 py-3">
                <SimilarityBadge score={story.similarity_score} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3 text-xs font-semibold">
                  <button onClick={() => navigate(`/stories/${story.id}`)} className="text-indigo-600 hover:text-indigo-800">
                    VIEW
                  </button>
                  <button onClick={() => navigate(`/stories/${story.id}?edit=1`)} className="text-slate-600 hover:text-slate-900">
                    EDIT
                  </button>
                  <button
                    onClick={() => onRegenerate(story)}
                    disabled={regeneratingId === story.id || !aiEnabled}
                    title={aiEnabled ? undefined : 'AI Generation is turned OFF (see header toggle)'}
                    className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
                  >
                    {regeneratingId === story.id ? 'REGENERATING...' : 'REGENERATE'}
                  </button>
                  <button onClick={() => onDelete(story)} className="text-red-600 hover:text-red-800">
                    DELETE
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
