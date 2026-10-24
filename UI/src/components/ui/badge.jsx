import { cn } from './utils'

const variantClasses = {
  default: 'border-transparent bg-gray-900 text-white',
  secondary: 'border-transparent bg-gray-100 text-gray-900',
  destructive: 'border-transparent bg-red-100 text-red-700',
  outline: 'text-gray-900 border-gray-300',
  success: 'border-transparent bg-green-50 text-green-700',
  warning: 'border-transparent bg-amber-50 text-amber-700',
  info: 'border-transparent bg-blue-50 text-blue-700',
  danger: 'border-transparent bg-red-50 text-red-700',
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    />
  )
}
