import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Eye, EyeOff, IdCard, Lock, ShieldCheck, Store, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { demoUsers } from '../data/seed'
import { AppLogo } from '../components/common/AppLogo'
import { LoginWaveBackground } from '../components/common/LoginWaveBackground'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const demos = [
  { id: 'EMP001', label: 'Employee', Icon: Users },
  { id: 'MGR001', label: 'Manager', Icon: Store },
  { id: 'ADMIN', label: 'Administrator', Icon: ShieldCheck },
]

export default function LoginPage() {
  const { isAuthenticated, needsStoreSelection, login } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={needsStoreSelection ? '/select-store' : '/'} replace />
  }

  const submit = e => {
    e.preventDefault()
    const result = login(id, pin)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success(`Welcome, ${result.user.name}`)
    if (result.user.role === 'administrator') {
      navigate('/select-store', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const useDemo = demoId => {
    setId(demoId)
    setPin(demoUsers[demoId].pin)
    setError('')
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-linear-to-b from-blue-50 via-white to-blue-50">
      <LoginWaveBackground />
      <div className="relative z-10 flex flex-1 flex-col px-4 py-8">
      <div className="m-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <AppLogo variant="login" className="mb-4" />
          <p className="mt-2 text-gray-600">Welcome back. Sign in with your staff ID and PIN.</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Use your individual employee or administrator credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={submit}
              className="space-y-4"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
            >
              <div className="space-y-2">
                <Label htmlFor="staff-id">Employee or administrator ID</Label>
                <div className="relative">
                  <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="staff-id"
                    name="staff-id"
                    className="pl-9"
                    value={id}
                    onChange={e => setId(e.target.value)}
                    placeholder="e.g. EMP001"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-pin">PIN</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="staff-pin"
                    name="staff-pin"
                    className={`pl-9 pr-10 tracking-[0.35em] ${showPin ? '' : '[text-security:disc] [-webkit-text-security:disc]'}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPin(v => !v)}
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" className="w-full">
                Sign in <ArrowRight size={16} />
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                Prototype accounts
              </p>
              <div className="grid gap-2">
                {demos.map(demo => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => useDemo(demo.id)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <demo.Icon size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{demo.label}</span>
                      <span className="block text-xs text-gray-500">
                        {demo.id} · {demoUsers[demo.id].pin}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
