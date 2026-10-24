import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultBroadcasts } from '../data/broadcasts'
import { defaultApprovalMeta, defaultApprovals, demoUsers, stores } from '../data/seed'

const AuthContext = createContext(null)
const STORAGE_KEY = 'northstar-auth'
const ADMIN_STORE_PICKED_KEY = 'northstar-admin-store-picked'

function readAdminStorePicked() {
  try {
    return sessionStorage.getItem(ADMIN_STORE_PICKED_KEY) === '1'
  } catch {
    return false
  }
}

function writeAdminStorePicked(picked) {
  try {
    sessionStorage.setItem(ADMIN_STORE_PICKED_KEY, picked ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function buildApprovalMeta(parsed) {
  return {
    ...defaultApprovalMeta,
    ...(parsed?.approvalMeta || {}),
    temperature: {
      ...defaultApprovalMeta.temperature,
      ...(parsed?.approvalMeta?.temperature || {}),
    },
    cleaning: {
      ...defaultApprovalMeta.cleaning,
      ...(parsed?.approvalMeta?.cleaning || {}),
    },
    problems: {
      ...defaultApprovalMeta.problems,
      ...(parsed?.approvalMeta?.problems || {}),
    },
    balance: {
      ...defaultApprovalMeta.balance,
      ...(parsed?.approvalMeta?.balance || {}),
    },
  }
}

export function AuthProvider({ children }) {
  const saved = readStorage()
  const savedUser =
    saved?.user?.id && demoUsers[saved.user.id]
      ? { ...demoUsers[saved.user.id], id: saved.user.id }
      : null

  const [user, setUser] = useState(savedUser)
  const [selectedStoreId, setSelectedStoreId] = useState(
    saved?.selectedStoreId || savedUser?.storeId || 'camden',
  )
  const [adminStorePicked, setAdminStorePicked] = useState(() => {
    // Returning admins who already picked a store this browser session skip the screen
    if (savedUser?.role === 'administrator') return readAdminStorePicked()
    return true
  })
  const [approvals, setApprovals] = useState({ ...defaultApprovals, ...(saved?.approvals || {}) })
  const [approvalMeta, setApprovalMeta] = useState(buildApprovalMeta(saved))
  const [broadcasts, setBroadcasts] = useState(() =>
    Array.isArray(saved?.broadcasts) && saved.broadcasts.length
      ? saved.broadcasts
      : defaultBroadcasts,
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: user ? { id: user.id } : null,
        selectedStoreId,
        approvals,
        approvalMeta,
        broadcasts,
      }),
    )
  }, [user, selectedStoreId, approvals, approvalMeta, broadcasts])

  const login = (id, pin) => {
    const key = id.trim().toUpperCase()
    const account = demoUsers[key]
    if (!account || account.pin !== pin) {
      return { ok: false, error: 'The ID or PIN is incorrect. Try a demo account below.' }
    }
    const next = { ...account, id: key }
    setUser(next)
    if (account.role === 'administrator') {
      // Force store selection once per login; header dropdown remains for later switches
      setSelectedStoreId(stores[0]?.id || 'camden')
      setAdminStorePicked(false)
      writeAdminStorePicked(false)
    } else {
      setSelectedStoreId(account.storeId)
      setAdminStorePicked(true)
      writeAdminStorePicked(true)
    }
    return { ok: true, user: next }
  }

  const confirmAdminStore = storeId => {
    setSelectedStoreId(storeId)
    setAdminStorePicked(true)
    writeAdminStorePicked(true)
  }

  const logout = () => {
    setUser(null)
    setAdminStorePicked(false)
    writeAdminStorePicked(false)
  }

  const updateTemperatureMeta = patch => {
    setApprovalMeta(prev => ({
      ...prev,
      temperature: { ...prev.temperature, ...patch },
    }))
  }

  const approveTemperatureWeek = manager => {
    const approvedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    setApprovals(x => ({ ...x, temperature: true }))
    updateTemperatureMeta({
      approvedBy: manager.name,
      approvedAt,
    })
  }

  const updateCleaningMeta = patch => {
    setApprovalMeta(prev => ({
      ...prev,
      cleaning: { ...prev.cleaning, ...patch },
    }))
  }

  const approveCleaningWeek = manager => {
    const approvedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    setApprovals(x => ({ ...x, cleaning: true }))
    updateCleaningMeta({
      approvedBy: manager.name,
      approvedAt,
    })
  }

  const updateProblemsMeta = patch => {
    setApprovalMeta(prev => ({
      ...prev,
      problems: { ...prev.problems, ...patch },
    }))
  }

  const approveProblemsWeek = manager => {
    const approvedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    setApprovals(x => ({ ...x, problems: true }))
    updateProblemsMeta({
      approvedBy: manager.name,
      approvedAt,
    })
  }

  const updateBalanceMeta = patch => {
    setApprovalMeta(prev => ({
      ...prev,
      balance: { ...prev.balance, ...patch },
    }))
  }

  const approveBalanceWeek = manager => {
    const approvedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    setApprovals(x => ({ ...x, balance: true }))
    updateBalanceMeta({
      approvedBy: manager.name,
      approvedAt,
    })
  }

  const addBroadcast = payload => {
    const entry = {
      id: `bc-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 16),
      ...payload,
    }
    setBroadcasts(prev => [entry, ...prev])
    return entry
  }

  const removeBroadcast = (id, actor) => {
    setBroadcasts(prev =>
      prev.filter(b => {
        if (b.id !== id) return true
        if (actor?.role === 'administrator') return false
        if (actor?.role === 'manager' && b.createdBy === actor.name) return false
        return true
      }),
    )
  }

  const value = useMemo(() => {
    const role = user?.role
    const activeStoreId = role === 'administrator' ? selectedStoreId : user?.storeId
    const store = stores.find(s => s.id === activeStoreId) || stores[0]
    const needsStoreSelection = role === 'administrator' && !adminStorePicked

    return {
      user,
      role,
      store,
      stores,
      selectedStoreId,
      setSelectedStoreId,
      confirmAdminStore,
      needsStoreSelection,
      adminStorePicked,
      approvals,
      setApprovals,
      approvalMeta,
      setApprovalMeta,
      broadcasts,
      addBroadcast,
      removeBroadcast,
      updateTemperatureMeta,
      approveTemperatureWeek,
      updateCleaningMeta,
      approveCleaningWeek,
      updateProblemsMeta,
      approveProblemsWeek,
      updateBalanceMeta,
      approveBalanceWeek,
      login,
      logout,
      isAuthenticated: Boolean(user),
      canEditOps: role === 'employee',
      canApprove: role === 'manager',
      canViewTraining: role === 'manager' || role === 'administrator',
      canViewReports: role === 'manager' || role === 'administrator',
      canManageUsers: role === 'administrator',
      canBroadcast: role === 'manager' || role === 'administrator',
      isReadOnly: role === 'administrator',
    }
  }, [user, selectedStoreId, adminStorePicked, approvals, approvalMeta, broadcasts])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
