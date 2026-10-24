import { Check, FileDown, Lock, Store, Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from './PageHeader'
import { StatusBadge } from './StatusBadge'
import { Button } from '../ui/button'
import { useAuth } from '../../auth/AuthContext'
import { printPage } from '../../lib/print'

export function FormTopBar({
  title,
  period,
  status = 'In progress',
  statusType = 'draft',
  approved,
  onApprove,
  onPrint,
  approveLabel = 'Approve',
  hideApprove = false,
  headerActions,
  storeName,
  lastSaved = '15:42',
  children,
}) {
  const { role, canApprove } = useAuth()
  const showPrint = role === 'manager' || role === 'administrator'
  const showApprove = !hideApprove && canApprove && !approved && onApprove

  return (
    <div className="space-y-3 sm:space-y-4">
      <PageHeader
        title={title}
        description={period}
        actions={
          <div className="flex w-full flex-wrap items-center justify-start gap-2 no-print sm:w-auto sm:justify-end">
            {headerActions}
            {showPrint ? (
              <Button
                variant="outline"
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={onPrint || (() => printPage())}
              >
                <FileDown size={16} /> Print
              </Button>
            ) : null}
            {showApprove ? (
              <Button
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => {
                  const ok = onApprove()
                  if (ok !== false) toast.success(`${title} approved and locked`)
                }}
              >
                <Check size={16} />
                <span className="sm:hidden">{approveLabel.replace(/ week$/i, '')}</span>
                <span className="hidden sm:inline">{approveLabel}</span>
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-gray-600 sm:gap-x-3 sm:gap-y-2 sm:text-sm">
        <StatusBadge type={approved ? 'approved' : statusType}>
          {approved ? 'Approved & locked' : status}
        </StatusBadge>
        <span className="inline-flex min-w-0 max-w-[45%] items-center gap-1 truncate sm:max-w-none sm:gap-1.5">
          <Store size={14} className="shrink-0" />
          <span className="truncate">{storeName}</span>
        </span>
        <span className="inline-flex items-center gap-1 sm:gap-1.5">
          <Clock3 size={14} className="shrink-0" />
          <span className="sm:hidden">Saved {lastSaved}</span>
          <span className="hidden sm:inline">Last saved {lastSaved}</span>
        </span>
        {approved ? (
          <span className="inline-flex items-center gap-1 text-gray-500 sm:gap-1.5">
            <Lock size={14} /> Locked
          </span>
        ) : null}
        {role === 'administrator' ? (
          <span className="inline-flex items-center gap-1 text-amber-700 sm:gap-1.5">
            <Lock size={14} /> Read-only
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}
