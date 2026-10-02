function colorFor(score: number): string {
  if (score >= 72) return 'bg-red-100 text-red-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

export default function SimilarityBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorFor(score)}`}>
      {Math.round(score)}%
    </span>
  )
}
