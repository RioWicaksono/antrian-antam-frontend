import { cn, STATUS_LABEL } from '../lib/utils'
import type { TaskStatus } from '../types'

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        `status-${status}`
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
