import { AlertTriangle, CheckCircle2, Clock3, Lock, PencilLine } from 'lucide-react'
import { Badge } from '../ui/badge'

const map = {
  approved: { variant: 'success', Icon: CheckCircle2 },
  pending: { variant: 'warning', Icon: Clock3 },
  draft: { variant: 'secondary', Icon: PencilLine },
  alert: { variant: 'danger', Icon: AlertTriangle },
  locked: { variant: 'secondary', Icon: Lock },
}

export function StatusBadge({ type = 'pending', children }) {
  const { variant, Icon } = map[type] || map.pending
  return (
    <Badge variant={variant}>
      <Icon size={12} />
      {children}
    </Badge>
  )
}
