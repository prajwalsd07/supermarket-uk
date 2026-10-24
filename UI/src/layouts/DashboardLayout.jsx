import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptPoundSterling,
  Sparkles,
  Thermometer,
  UserCog,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { formatToday } from '../data/seed'
import { AppLogo } from '../components/common/AppLogo'
import { FormSelect } from '../components/common/FormSelect'
import { Button } from '../components/ui/button'
import { cn } from '../components/ui/utils'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/temperature', label: 'Temperature checks', icon: Thermometer, badge: 1 },
  { to: '/cleaning', label: 'Cleaning schedule', icon: Sparkles },
  { to: '/problems', label: 'Problem report', icon: AlertTriangle },
  { to: '/balance', label: 'Scratch-card sales', icon: ReceiptPoundSterling },
  { to: '/dayend', label: 'Day-end report', icon: BarChart3 },
  { to: '/training', label: 'Staff training', icon: BookOpenCheck, managerOnly: true },
  { to: '/users', label: 'Users & stores', icon: UserCog, adminOnly: true },
]

export default function DashboardLayout() {
  const { user, role, store, stores, selectedStoreId, setSelectedStoreId, logout, approvals } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const items = navItems.filter(item => {
    if (item.adminOnly && role !== 'administrator') return false
    if (item.managerOnly && role === 'employee') return false
    if (item.employeeHidden && role === 'employee') return false
    return true
  })

  const initials = user.name
    .split(' ')
    .map(x => x[0])
    .join('')

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden no-print"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform no-print',
          menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <AppLogo />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </Button>
        </div>

        <div className="mx-3 mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="mb-1.5 text-xs text-gray-500">Current store</p>
          {role === 'administrator' ? (
            <FormSelect
              id="sidebar-store"
              value={selectedStoreId}
              onValueChange={id => {
                setSelectedStoreId(id)
                setMenuOpen(false)
                navigate('/')
              }}
              options={stores.map(s => ({ value: s.id, label: s.name }))}
              placeholder="Select store"
              triggerClassName="h-9 w-full bg-white"
              contentClassName="w-[14rem]"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-gray-900">{store.name}</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.to === '/temperature' && !approvals.temperature ? (
                <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">1</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-6 no-print">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">{formatToday()}</p>
            <p className="truncate text-sm font-semibold text-gray-900">{store.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" title="Alerts">
              <AlertTriangle size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
