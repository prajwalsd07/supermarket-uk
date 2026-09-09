import { cn } from '../ui/utils'

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight text-gray-900 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-base">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:self-start">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
