import { AlertTriangle } from 'lucide-react'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../ui/utils'

/** Lists the problems found on a page and collects the staff comment. Renders nothing when there are no issues. */
export function IssueCommentPanel({
  id,
  issues,
  value,
  onChange,
  disabled = false,
  title = 'Corrective action required',
  label = 'Action taken',
  placeholder = 'Describe what was done or why this happened…',
  className,
}) {
  if (!issues.length) return null

  return (
    <div
      className={cn(
        'no-print flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 sm:gap-3 sm:p-4',
        className,
      )}
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
        <div>
          <p className="text-sm font-semibold text-red-900 sm:text-base">{title}</p>
          {issues.length === 1 ? (
            <p className="text-xs text-red-800 sm:text-sm">{issues[0]}</p>
          ) : (
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-red-800 sm:text-sm">
              {issues.map(issue => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Textarea
            id={id}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
