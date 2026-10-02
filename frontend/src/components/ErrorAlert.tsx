interface ErrorAlertProps {
  message: string
  onRetry?: () => void
}

export default function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 font-medium text-red-700 underline hover:text-red-900"
        >
          Retry
        </button>
      )}
    </div>
  )
}
