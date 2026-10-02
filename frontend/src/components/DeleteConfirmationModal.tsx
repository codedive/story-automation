import Modal from './Modal'

interface DeleteConfirmationModalProps {
  title: string
  message: string
  confirmLabel?: string
  isDeleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmationModal({
  title,
  message,
  confirmLabel = 'Delete',
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <Modal title={title} onClose={onCancel} widthClassName="max-w-md">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
