import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Megaphone, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  AUDIENCE_OPTIONS,
  audienceLabel,
  formatBroadcastWindow,
  storeScopeLabel,
  visibleBroadcastsForRole,
} from '../../data/broadcasts'
import { FormSelect } from '../common/FormSelect'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../ui/utils'

function defaultSchedule() {
  return {
    startDate: '2026-09-04',
    startTime: '08:00',
    endDate: '2026-09-04',
    endTime: '20:00',
  }
}

function StoreMultiSelect({ stores, selectedIds, allStores, onChange }) {
  const [open, setOpen] = useState(false)

  const summary = allStores
    ? 'All stores'
    : selectedIds.length === 0
      ? 'Select stores'
      : selectedIds.length === 1
        ? stores.find(s => s.id === selectedIds[0])?.name || '1 store'
        : `${selectedIds.length} stores selected`

  const toggleStore = id => {
    if (allStores) return
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    onChange({ allStores: false, storeIds: next })
  }

  const setAll = checked => {
    onChange({
      allStores: checked,
      storeIds: checked ? stores.map(s => s.id) : [],
    })
  }

  return (
    <div className="space-y-1.5">
      <Label>Supermarkets</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className={cn(selectedIds.length || allStores ? 'text-gray-900' : 'text-gray-500')}>
            {summary}
          </span>
          <ChevronsUpDown size={16} className="shrink-0 text-gray-400" />
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close store list"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={allStores}
                  onChange={e => setAll(e.target.checked)}
                />
                <span className="font-medium text-gray-900">All stores</span>
              </label>
              <div className="my-1 border-t border-gray-100" />
              {stores.map(s => {
                const checked = allStores || selectedIds.includes(s.id)
                return (
                  <label
                    key={s.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-50',
                      allStores && 'opacity-60',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-blue-600"
                      checked={checked}
                      disabled={allStores}
                      onChange={() => toggleStore(s.id)}
                    />
                    <span className="min-w-0 flex-1 truncate text-gray-900">{s.name}</span>
                    {checked ? <Check size={14} className="shrink-0 text-blue-600" /> : null}
                  </label>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
      <p className="text-xs text-gray-500">Choose all stores or pick multiple locations.</p>
    </div>
  )
}

export function BroadcastPanel() {
  const { role, user, store, stores, broadcasts, addBroadcast, removeBroadcast, canBroadcast } =
    useAuth()
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('staff')
  const [allStores, setAllStores] = useState(false)
  const [storeIds, setStoreIds] = useState([store.id])
  const [schedule, setSchedule] = useState(defaultSchedule)

  const visible = useMemo(
    () => visibleBroadcastsForRole(broadcasts, role, store.id, undefined, user?.name),
    [broadcasts, role, store.id, user?.name],
  )

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setAudience('staff')
    setAllStores(false)
    setStoreIds([store.id])
    setSchedule(defaultSchedule())
    setComposing(false)
  }

  const publish = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Add a title and message')
      return
    }
    const startAt = `${schedule.startDate}T${schedule.startTime}`
    const endAt = `${schedule.endDate}T${schedule.endTime}`
    if (new Date(endAt) < new Date(startAt)) {
      toast.error('End must be after start')
      return
    }

    const isAdmin = role === 'administrator'
    const targetAll = isAdmin && allStores
    const targetIds = isAdmin
      ? targetAll
        ? stores.map(s => s.id)
        : storeIds
      : [store.id]

    if (isAdmin && !targetAll && targetIds.length === 0) {
      toast.error('Select at least one supermarket')
      return
    }

    addBroadcast({
      storeId: targetIds[0] || store.id,
      storeIds: targetIds,
      allStores: Boolean(targetAll),
      title: title.trim(),
      message: message.trim(),
      audience: role === 'manager' ? 'staff' : audience,
      startAt,
      endAt,
      createdBy: user.name,
      createdByRole: role,
    })
    toast.success(
      targetAll
        ? 'Broadcast published to all stores'
        : targetIds.length > 1
          ? `Broadcast published to ${targetIds.length} stores`
          : 'Broadcast published',
    )
    resetForm()
  }

  const canDelete = b =>
    role === 'administrator' || (role === 'manager' && b.createdBy === user.name)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Broadcasts</h3>
          <p className="text-xs text-gray-500 sm:text-sm">
            Active messages for {store.name}
          </p>
        </div>
        {canBroadcast ? (
          <Button
            variant={composing ? 'outline' : 'default'}
            size="sm"
            className="min-w-0"
            onClick={() => (composing ? resetForm() : setComposing(true))}
          >
            {composing ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> New broadcast
              </>
            )}
          </Button>
        ) : null}
      </div>

      {composing && canBroadcast ? (
        <Card>
          <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">New broadcast</CardTitle>
            <CardDescription>
              {role === 'manager'
                ? 'Staff will see this on Overview while it is scheduled.'
                : 'Choose who should see this on Overview while it is scheduled.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3 sm:space-y-4 sm:px-6 sm:pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="bc-title">Title</Label>
              <Input
                id="bc-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short headline"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-message">Message</Label>
              <Textarea
                id="bc-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What should the team know?"
                rows={3}
              />
            </div>

            {role === 'administrator' ? (
              <>
                <FormSelect
                  id="bc-audience"
                  label="Show to"
                  value={audience}
                  onValueChange={setAudience}
                  options={AUDIENCE_OPTIONS}
                />
                <StoreMultiSelect
                  stores={stores}
                  selectedIds={storeIds}
                  allStores={allStores}
                  onChange={({ allStores: nextAll, storeIds: nextIds }) => {
                    setAllStores(nextAll)
                    setStoreIds(nextIds)
                  }}
                />
              </>
            ) : (
              <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Audience: <strong>Staff</strong> · Store: <strong>{store.name}</strong>
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bc-start-date">Start date</Label>
                <Input
                  id="bc-start-date"
                  type="date"
                  value={schedule.startDate}
                  onChange={e => setSchedule(s => ({ ...s, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bc-start-time">Start time</Label>
                <Input
                  id="bc-start-time"
                  type="time"
                  value={schedule.startTime}
                  onChange={e => setSchedule(s => ({ ...s, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bc-end-date">End date</Label>
                <Input
                  id="bc-end-date"
                  type="date"
                  value={schedule.endDate}
                  onChange={e => setSchedule(s => ({ ...s, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bc-end-time">End time</Label>
                <Input
                  id="bc-end-time"
                  type="time"
                  value={schedule.endTime}
                  onChange={e => setSchedule(s => ({ ...s, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={publish}>
                <Megaphone size={16} /> Publish broadcast
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visible.length ? (
        <div className="space-y-2 sm:space-y-3">
          {visible.map(b => (
            <div
              key={b.id}
              className={cn(
                'rounded-xl border px-3 py-3 sm:px-4',
                b.createdByRole === 'administrator'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-blue-200 bg-blue-50',
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    b.createdByRole === 'administrator'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700',
                  )}
                >
                  <Megaphone size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{b.title}</p>
                    {canDelete(b) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-gray-500"
                        title="Remove broadcast"
                        onClick={() => {
                          removeBroadcast(b.id, user)
                          toast.success('Broadcast removed')
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{b.message}</p>
                  <p className="mt-2 text-[11px] text-gray-500 sm:text-xs">
                    From {b.createdBy} · {audienceLabel(b.audience)} ·{' '}
                    {storeScopeLabel(b, stores)} · {formatBroadcastWindow(b.startAt, b.endAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="px-3 py-4 text-sm text-gray-500 sm:px-6">
            No active broadcasts for you right now.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
