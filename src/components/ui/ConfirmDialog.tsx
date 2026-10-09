import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="lg" ariaLabel={title}>
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div>
          <p className="font-bold text-red-800">{title}</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} data-autofocus>
          {cancelLabel}
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
