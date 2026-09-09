import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { AppLogo } from '../components/common/AppLogo'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../components/ui/utils'

export default function SelectStorePage() {
  const { role, stores, selectedStoreId, confirmAdminStore, needsStoreSelection, isAuthenticated } =
    useAuth()
  const navigate = useNavigate()
  const [choice, setChoice] = useState(selectedStoreId || stores[0]?.id || '')

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== 'administrator') return <Navigate to="/" replace />
  if (!needsStoreSelection) return <Navigate to="/" replace />

  const continueToApp = () => {
    if (!choice) {
      toast.error('Please select a store to continue')
      return
    }
    const store = stores.find(s => s.id === choice)
    confirmAdminStore(choice)
    toast.success(`Working in ${store?.name || 'selected store'}`)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center sm:mb-8">
          <AppLogo className="mb-4 justify-center" />
          <p className="text-sm text-gray-600 sm:text-base">
            Choose the store you want to work in for this session.
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-3 sm:pb-4">
            <CardTitle className="text-center text-xl sm:text-2xl">Select store</CardTitle>
            <CardDescription className="text-center">
              You can switch stores later from the side navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div className="grid gap-2">
              {stores.map(store => {
                const active = choice === store.id
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setChoice(store.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition',
                      active
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      <Building2 size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{store.name}</span>
                      <span className="block text-xs text-gray-500">
                        {store.code} · Manager {store.manager}
                      </span>
                    </span>
                    {active ? <Check size={18} className="shrink-0 text-blue-600" /> : null}
                  </button>
                )
              })}
            </div>

            <Button type="button" className="w-full" onClick={continueToApp}>
              Continue <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
