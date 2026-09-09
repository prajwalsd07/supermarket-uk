import { cn } from './utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col gap-6 rounded-xl border border-gray-200 bg-white text-gray-900', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('grid items-start gap-1.5 px-6 pt-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h4 className={cn('text-lg font-semibold leading-none', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-gray-600', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center px-6 pb-6', className)} {...props} />
}
