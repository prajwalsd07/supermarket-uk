import { cn } from '../ui/utils'
import premierLogo from '../../assets/premier-logo.jpg'

const APP_NAME = 'Premier Woodgreen'

export function AppLogo({ variant = 'sidebar', className }) {
  const isLogin = variant === 'login'

  return (
    <div
      className={cn(
        'flex items-center',
        isLogin ? 'flex-col gap-3 text-center' : 'min-w-0 gap-3',
        className,
      )}
    >
      <img
        src={premierLogo}
        alt="Premier"
        className={cn(
          'shrink-0 object-cover',
          isLogin ? 'h-20 w-48 rounded-2xl shadow-md sm:h-24 sm:w-56' : 'h-9 w-20 rounded-lg',
        )}
      />
      <span className={cn('leading-tight', isLogin ? 'space-y-1' : 'min-w-0')}>
        <span
          className={cn(
            'block font-bold text-gray-900',
            isLogin ? 'text-lg sm:text-xl' : 'truncate text-sm',
          )}
        >
          {APP_NAME}
        </span>
        <span className={cn('block text-gray-500', isLogin ? 'text-xs sm:text-sm' : 'truncate text-xs')}>
          Store operations
        </span>
      </span>
    </div>
  )
}
