import type { StoryStatus } from '../types'

const STYLES: Record<StoryStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
}

export default function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
