import { useNavigate } from 'react-router-dom'
import { useAiToggle } from '../context/AiToggleContext'
import type { StoryListItem } from '../types'
import SimilarityBadge from './SimilarityBadge'
import StatusBadge from './StatusBadge'

interface StoryCardProps {
  story: StoryListItem
  regenerating: boolean
  onRegenerate: (story: StoryListItem) => void
  onDelete: (story: StoryListItem) => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function StoryCard({ story, regenerating, onRegenerate, onDelete }: StoryCardProps) {
  const navigate = useNavigate()
  const { aiEnabled } = useAiToggle()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-400">#{story.episode_number}</p>
          <h3 className="font-semibold text-slate-800">{story.title}</h3>
        </div>
        <StatusBadge status={story.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{story.summary}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Created: {formatDate(story.created_at)}</span>
        <SimilarityBadge score={story.similarity_score} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <button onClick={() => navigate(`/stories/${story.id}`)} className="text-indigo-600 hover:text-indigo-800">
          VIEW
        </button>
        <button onClick={() => navigate(`/stories/${story.id}?edit=1`)} className="text-slate-600 hover:text-slate-900">
          EDIT
        </button>
        <button
          onClick={() => onRegenerate(story)}
          disabled={regenerating || !aiEnabled}
          title={aiEnabled ? undefined : 'AI Generation is turned OFF (see header toggle)'}
          className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
        >
          {regenerating ? 'REGENERATING...' : 'REGENERATE'}
        </button>
        <button onClick={() => onDelete(story)} className="text-red-600 hover:text-red-800">
          DELETE
        </button>
      </div>
    </div>
  )
}
