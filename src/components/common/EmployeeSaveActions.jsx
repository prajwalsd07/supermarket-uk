import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../ui/utils'

/**
 * Employee save actions — short labels; left-aligned and full-width on mobile.
 */
export function EmployeeSaveActions({
  dirty,
  saving = false,
  onSave,
  onSaveAndContinue,
  className = '',
}) {
  return (
    <div className={cn('flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto', className)}>
      <Button
        variant="outline"
        size="sm"
        className="min-w-[5.5rem] flex-1 sm:flex-none"
        disabled={!dirty || saving}
        onClick={onSave}
      >
        Save
      </Button>
      <Button
        size="sm"
        className="min-w-[7.5rem] flex-1 sm:flex-none"
        disabled={!dirty || saving}
        onClick={onSaveAndContinue}
      >
        Save & next
        <ArrowRight size={14} />
      </Button>
    </div>
  )
}
