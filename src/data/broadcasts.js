/** Demo “now” aligned with prototype date so seeded broadcasts stay active. */
export const BROADCAST_NOW = new Date('2026-09-04T14:30:00')

export const AUDIENCE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'managers', label: 'Managers' },
  { value: 'everyone', label: 'Everyone' },
]

export const defaultBroadcasts = [
  {
    id: 'bc-1',
    storeId: 'camden',
    storeIds: ['camden'],
    allStores: false,
    title: 'Afternoon temperature reminder',
    message: 'Please complete the afternoon chilled cabinet round before 16:00.',
    audience: 'staff',
    startAt: '2026-09-04T08:00',
    endAt: '2026-09-04T18:00',
    createdBy: 'Olivia Martin',
    createdByRole: 'manager',
    createdAt: '2026-09-04T07:45',
  },
  {
    id: 'bc-2',
    storeId: 'camden',
    storeIds: ['camden', 'brixton', 'greenwich', 'richmond'],
    allStores: true,
    title: 'Regional audit this week',
    message: 'Area managers may visit stores today. Keep paperwork ready for sign-off.',
    audience: 'everyone',
    startAt: '2026-09-04T06:00',
    endAt: '2026-09-05T22:00',
    createdBy: 'Alex Morgan',
    createdByRole: 'administrator',
    createdAt: '2026-09-03T17:00',
  },
]

export function isBroadcastActive(broadcast, now = BROADCAST_NOW) {
  const start = new Date(broadcast.startAt)
  const end = new Date(broadcast.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return now >= start && now <= end
}

function audienceMatchesRole(audience, role) {
  if (audience === 'everyone') return true
  if (audience === 'staff') return role === 'employee' || role === 'administrator'
  if (audience === 'managers') return role === 'manager' || role === 'administrator'
  return false
}

/** Resolve target store ids (supports legacy storeId-only records). */
export function broadcastStoreIds(broadcast) {
  if (broadcast.allStores) return ['*']
  if (Array.isArray(broadcast.storeIds) && broadcast.storeIds.length) return broadcast.storeIds
  if (broadcast.storeId) return [broadcast.storeId]
  return []
}

export function broadcastAppliesToStore(broadcast, storeId) {
  if (broadcast.allStores) return true
  const ids = broadcastStoreIds(broadcast)
  return ids.includes(storeId)
}

/** Active broadcasts for this store that the viewer’s role is allowed to see. */
export function visibleBroadcastsForRole(list, role, storeId, now = BROADCAST_NOW, viewerName) {
  return (list || [])
    .filter(b => broadcastAppliesToStore(b, storeId))
    .filter(b => isBroadcastActive(b, now))
    .filter(
      b => audienceMatchesRole(b.audience, role) || (viewerName && b.createdBy === viewerName),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function formatBroadcastWindow(startAt, endAt) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function audienceLabel(audience) {
  return AUDIENCE_OPTIONS.find(o => o.value === audience)?.label || audience
}

export function storeScopeLabel(broadcast, stores) {
  if (broadcast.allStores) return 'All stores'
  const ids = broadcastStoreIds(broadcast).filter(id => id !== '*')
  if (!ids.length) return '—'
  if (ids.length === 1) {
    return stores.find(s => s.id === ids[0])?.name || ids[0]
  }
  return `${ids.length} stores`
}
