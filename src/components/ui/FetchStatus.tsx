import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { CloudIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { LoadingDots } from './LoadingDots'
import { Spinner } from './Spinner'

export type FetchState = 'idle' | 'loading' | 'success' | 'error'

export interface FetchStatusProps {
  state: FetchState
  /** Override the default message for any state. */
  messages?: Partial<Record<FetchState, string>>
  onRetry?: () => void
}

const defaults: Record<FetchState, string> = {
  idle: 'Not loaded yet',
  loading: 'Fetching',
  success: 'Up to date',
  error: 'Couldn’t load data',
}

/** One-line status for a data request: idle → loading → success | error (with retry). Announced politely. */
export function FetchStatus({ state, messages, onRetry }: FetchStatusProps) {
  const text = messages?.[state] ?? defaults[state]
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm">
      {state === 'idle' && <CloudIcon className="h-5 w-5 text-gray-400" />}
      {state === 'loading' && <Spinner size="md" decorative className="text-brand-600" />}
      {state === 'success' && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
      {state === 'error' && <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
      <span className={state === 'error' ? 'text-red-700' : state === 'idle' ? 'text-gray-500' : 'text-gray-700'}>{text}</span>
      {state === 'loading' && <LoadingDots className="text-gray-400" />}
      {state === 'error' && onRetry && (
        <Button size="xs" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </p>
  )
}
