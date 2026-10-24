import { cn } from '../ui/utils'

export function AppLogo({ className, compact = false }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold">
        N
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold text-gray-900">Northstar</span>
          <span className="block text-xs text-gray-500">Store operations</span>
        </span>
      ) : null}
    </div>
  )
}
