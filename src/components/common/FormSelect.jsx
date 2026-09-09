import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function FormSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  required = false,
  error,
  contentClassName,
  triggerClassName,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id}>
          {label} {required ? '*' : null}
        </Label>
      ) : null}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className={triggerClassName} disabled={disabled}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName ?? 'w-full'}>
          {options.map(opt => {
            const o = typeof opt === 'string' ? { value: opt, label: opt } : opt
            return (
              <SelectItem key={String(o.value)} value={o.value}>
                {o.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
