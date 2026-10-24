import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { money } from '../data/seed'
import { getFlowStep } from '../data/employeeFlow'
import { printPage } from '../lib/print'
import { FormTopBar } from '../components/common/FormTopBar'
import { EmployeeSaveActions } from '../components/common/EmployeeSaveActions'
import { FormSelect } from '../components/common/FormSelect'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { cn } from '../components/ui/utils'

/** Demo week: Mon 31 Aug – Sun 6 Sep 2026 */
const WEEK_DAYS = [
  { id: 0, name: 'Monday', short: 'Mon', date: '31/08/26', long: 'Monday, 31 August 2026' },
  { id: 1, name: 'Tuesday', short: 'Tue', date: '01/09/26', long: 'Tuesday, 1 September 2026' },
  { id: 2, name: 'Wednesday', short: 'Wed', date: '02/09/26', long: 'Wednesday, 2 September 2026' },
  { id: 3, name: 'Thursday', short: 'Thu', date: '03/09/26', long: 'Thursday, 3 September 2026' },
  { id: 4, name: 'Friday', short: 'Fri', date: '04/09/26', long: 'Friday, 4 September 2026' },
  { id: 5, name: 'Saturday', short: 'Sat', date: '05/09/26', long: 'Saturday, 5 September 2026' },
  { id: 6, name: 'Sunday', short: 'Sun', date: '06/09/26', long: 'Sunday, 6 September 2026' },
]

const DEMO_DAY = 4 // Friday

const SHIFTS = [
  { key: 'close1', label: 'Morning', hours: '08:00–14:00', short: 'AM' },
  { key: 'close2', label: 'Afternoon', hours: '14:00–19:00', short: 'PM' },
  { key: 'close3', label: 'Evening', hours: '19:00–23:00', short: 'Eve' },
]

const CARD_TYPES = [
  { name: 'Lucky Lines', token: 5 },
  { name: 'Cashword Blue', token: 5 },
  { name: 'Ruby Doubler', token: 10 },
  { name: '£100k Purple', token: 5 },
]

function makeRows(openings, closes) {
  return CARD_TYPES.map((card, i) => ({
    name: card.name,
    token: card.token,
    opening: openings[i],
    close1: closes[i][0],
    close2: closes[i][1],
    close3: closes[i][2],
  }))
}

function makeDay(openings, closes, saved = true) {
  return {
    rows: makeRows(openings, closes),
    saved,
  }
}

/** Seed Mon–Thu complete; Fri in progress; Sat–Sun upcoming from Fri evening stock */
const initialWeek = [
  makeDay(
    [50, 26, 50, 8],
    [
      [48, 47, 46],
      [25, 24, 24],
      [49, 48, 47],
      [7, 6, 6],
    ],
  ),
  makeDay(
    [46, 24, 47, 6],
    [
      [45, 44, 43],
      [23, 22, 22],
      [46, 45, 45],
      [5, 5, 4],
    ],
  ),
  makeDay(
    [43, 22, 45, 4],
    [
      [42, 41, 40],
      [21, 20, 20],
      [44, 43, 42],
      [4, 3, 3],
    ],
  ),
  makeDay(
    [40, 20, 42, 3],
    [
      [39, 38, 37],
      [19, 18, 18],
      [41, 40, 40],
      [3, 2, 2],
    ],
  ),
  makeDay(
    [48, 24, 49, 6],
    [
      [45, 43, 41],
      [24, 21, 20],
      [47, 47, 44],
      [4, 4, 2],
    ],
    false,
  ),
  makeDay(
    [41, 20, 44, 2],
    [
      [41, 41, 41],
      [20, 20, 20],
      [44, 44, 44],
      [2, 2, 2],
    ],
    false,
  ),
  makeDay(
    [41, 20, 44, 2],
    [
      [41, 41, 41],
      [20, 20, 20],
      [44, 44, 44],
      [2, 2, 2],
    ],
    false,
  ),
]

function calcShift(row, shiftIndex) {
  const open = shiftIndex === 0 ? row.opening : row[`close${shiftIndex}`]
  const close = row[`close${shiftIndex + 1}`]
  const qty = Math.max(0, Number(open) - Number(close))
  return { open, close, qty, val: qty * row.token }
}

function dayTotal(day) {
  return day.rows.reduce(
    (sum, row) => sum + [0, 1, 2].reduce((s, i) => s + calcShift(row, i).val, 0),
    0,
  )
}

function shiftTotal(day, shiftIndex) {
  return day.rows.reduce((sum, row) => sum + calcShift(row, shiftIndex).val, 0)
}

function dayStatus(day, dayIndex, todayIndex) {
  if (dayIndex > todayIndex) return 'upcoming'
  if (day.saved) return 'complete'
  if (dayIndex === todayIndex) return 'in-progress'
  return 'pending'
}

function statusLabel(status) {
  if (status === 'complete') return 'Complete'
  if (status === 'in-progress') return 'In progress'
  if (status === 'upcoming') return 'Upcoming'
  return 'Pending'
}

export default function BalanceSheetPage() {
  const navigate = useNavigate()
  const flow = getFlowStep('/balance')
  const {
    user,
    role,
    store,
    approvals,
    approvalMeta,
    canEditOps,
    isReadOnly,
    canApprove,
    updateBalanceMeta,
    approveBalanceWeek,
  } = useAuth()

  const [week, setWeek] = useState(initialWeek)
  const [viewMode, setViewMode] = useState('day')
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY)
  const [dirty, setDirty] = useState(false)

  const balanceMeta = approvalMeta.balance
  const approved = approvals.balance
  const editable = canEditOps && !approved && !isReadOnly
  const isStaff = role === 'employee'
  const todayDayIndex = DEMO_DAY
  const dayMeta = WEEK_DAYS[selectedDay]
  const todayMeta = WEEK_DAYS[todayDayIndex]
  const activeDayIndex = selectedDay
  const activeDay = week[activeDayIndex]
  const canEditActive = editable && activeDayIndex === todayDayIndex && !approved

  const activeTotal = useMemo(() => dayTotal(activeDay), [activeDay])
  const weekTotal = useMemo(
    () =>
      week.reduce(
        (sum, day, i) => (i <= todayDayIndex ? sum + dayTotal(day) : sum),
        0,
      ),
    [week, todayDayIndex],
  )

  const weekStats = useMemo(() => {
    let complete = 0
    let pending = 0
    week.forEach((day, i) => {
      const status = dayStatus(day, i, todayDayIndex)
      if (status === 'complete') complete += 1
      else if (status === 'pending' || status === 'in-progress') pending += 1
    })
    return { complete, pending, today: dayTotal(week[todayDayIndex]), week: weekTotal }
  }, [week, todayDayIndex, weekTotal])

  const activeStatus = dayStatus(activeDay, activeDayIndex, todayDayIndex)

  const updateClose = (rowIndex, shiftKey, value) => {
    if (!canEditActive) return
    setDirty(true)
    setWeek(days =>
      days.map((day, di) => {
        if (di !== activeDayIndex) return day
        return {
          ...day,
          rows: day.rows.map((row, ri) =>
            ri === rowIndex ? { ...row, [shiftKey]: Number(value) } : row,
          ),
        }
      }),
    )
  }

  const save = () => {
    const lastSavedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    setWeek(days =>
      days.map((day, i) => (i === todayDayIndex ? { ...day, saved: true } : day)),
    )
    updateBalanceMeta({
      recordedBy: user.name,
      recordedById: user.id,
      lastSavedAt,
    })
    setDirty(false)
    toast.success('Scratch-card sales saved')
    return true
  }

  const saveAndContinue = () => {
    if (!save()) return
    toast.success('Daily process complete')
    navigate(flow.next)
  }

  const approveWeek = () => {
    if (!week[todayDayIndex].saved) {
      toast.error('Today’s scratch-card sales must be saved before approving the week')
      return false
    }
    approveBalanceWeek(user)
    setDirty(false)
    return true
  }

  const printPortraitA4 = () => printPage({ portrait: true, styleId: 'scratch-print-page-size' })

  return (
    <div className="space-y-4 sm:space-y-6">
      <FormTopBar
        title="Weekly scratch-card sales"
        period="Week commencing 31 August 2026"
        storeName={store.name}
        status={
          approved
            ? 'Approved & locked'
            : `${statusLabel(activeStatus)} · ${money(activeTotal)}`
        }
        statusType={approved ? 'approved' : activeStatus === 'complete' ? 'approved' : 'pending'}
        approved={approved}
        approveLabel="Approve week"
        onApprove={canApprove ? approveWeek : undefined}
        lastSaved={balanceMeta.lastSavedAt?.split(',').pop()?.trim() || '15:42'}
        onPrint={printPortraitA4}
        headerActions={
          canEditActive ? (
            <EmployeeSaveActions dirty={dirty} onSave={save} onSaveAndContinue={saveAndContinue} />
          ) : null
        }
      >
        <div className="no-print space-y-3 sm:space-y-4">
          {!isStaff ? <StatsBanner stats={weekStats} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <span className="font-semibold">{isStaff ? 'Today' : 'Viewing'}</span>
              <span className="mx-1.5 text-blue-300">·</span>
              <span className="text-blue-800/90">
                {viewMode === 'day' && selectedDay !== todayDayIndex && !isStaff
                  ? `${dayMeta.short} ${dayMeta.date}`
                  : `${todayMeta.short} ${todayMeta.date}`}
              </span>
            </div>

            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-100 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setViewMode('day')
                  setSelectedDay(todayDayIndex)
                }}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium sm:flex-none sm:py-1.5',
                  viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600',
                )}
              >
                {isStaff ? <Pencil size={14} /> : <Eye size={14} />} Today
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium sm:flex-none sm:py-1.5',
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600',
                )}
              >
                <Eye size={14} /> Week
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-green-500" /> Complete
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> In progress
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full border border-dashed border-gray-400 bg-white" />{' '}
              Pending
            </span>
          </div>

          {viewMode === 'day' ? (
            <DaySheet
              dayMeta={WEEK_DAYS[activeDayIndex]}
              day={activeDay}
              status={activeStatus}
              editable={canEditActive}
              total={activeTotal}
              onUpdateClose={updateClose}
              showAddType={canEditActive || role === 'manager'}
            />
          ) : (
            <WeekOverview
              week={week}
              selectedDay={activeDayIndex}
              todayDayIndex={todayDayIndex}
              onSelectDay={dayId => {
                setSelectedDay(dayId)
                setViewMode('day')
              }}
            />
          )}
        </div>

        {(role === 'manager' || role === 'administrator') ? (
          <div className="print-only scratch-print-sheet">
            <PrintSheet
              day={activeDay}
              dayMeta={WEEK_DAYS[activeDayIndex]}
              storeName={store.name}
              approved={approved}
              recordedBy={balanceMeta.recordedBy}
              approvedBy={balanceMeta.approvedBy}
              approvedAt={balanceMeta.approvedAt}
            />
          </div>
        ) : null}
      </FormTopBar>
    </div>
  )
}

function StatsBanner({ stats }) {
  const items = [
    { label: 'Sold today', value: money(stats.today), tone: 'text-gray-900' },
    { label: 'Week total', value: money(stats.week), tone: 'text-blue-700' },
    { label: 'Days complete', value: stats.complete, tone: 'text-green-700' },
    { label: 'Pending days', value: stats.pending, tone: 'text-amber-700' },
  ]

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
        {items.map(item => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 sm:px-3">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
              {item.label}
            </p>
            <p className={cn('text-lg sm:text-xl font-bold', item.tone)}>{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DaySheet({ dayMeta, day, status, editable, total, onUpdateClose, showAddType }) {
  const [shiftIndex, setShiftIndex] = useState(0)
  const shift = SHIFTS[shiftIndex]
  const thisShiftTotal = shiftTotal(day, shiftIndex)

  return (
    <Card>
      <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Scratch-card movement</p>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                <span className="sm:hidden">{dayMeta.short} {dayMeta.date}</span>
                <span className="hidden sm:inline">{dayMeta.long} · </span>
                <span className="hidden sm:inline">Opening figures carry forward between shifts.</span>
                <span className="sm:hidden"> · Openings carry forward</span>
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-xs font-medium',
                status === 'complete' && 'bg-green-50 text-green-700',
                status === 'in-progress' && 'bg-amber-50 text-amber-800',
                (status === 'pending' || status === 'upcoming') && 'bg-gray-100 text-gray-600',
              )}
            >
              {statusLabel(status)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-500">Total value sold</p>
            <p className="text-base font-bold text-gray-900 sm:text-lg">{money(total)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <FormSelect
            id="balance-shift"
            label="Shift"
            value={String(shiftIndex)}
            onValueChange={v => setShiftIndex(Number(v))}
            placeholder="Select shift"
            triggerClassName="w-full sm:w-64"
            options={SHIFTS.map((s, i) => ({
              value: String(i),
              label: `${s.label} · ${s.hours}`,
            }))}
          />
          <p className="text-xs sm:text-sm text-gray-500 sm:pb-1">
            {editable ? (
              <>
                Entering <strong className="text-gray-800">{shift.label}</strong> closing counts
              </>
            ) : (
              <>
                Viewing <strong className="text-gray-800">{shift.label}</strong> (read-only)
              </>
            )}
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {day.rows.map((row, ri) => {
            const x = calcShift(row, shiftIndex)
            return (
              <div
                key={row.name}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{row.name}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">Token {money(row.token)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <StatChip label="Opening" value={x.open} />
                  <label className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Closing
                    </span>
                    {editable ? (
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="mt-1 h-9 bg-white text-base sm:h-8 sm:text-sm"
                        value={x.close}
                        onChange={e => onUpdateClose(ri, shift.key, e.target.value)}
                      />
                    ) : (
                      <span className="mt-1 block text-sm font-semibold text-gray-900">{x.close}</span>
                    )}
                  </label>
                  <StatChip label="Qty" value={x.qty} />
                  <StatChip label="Value" value={money(x.val)} emphasize />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
          <span className="font-medium text-gray-700">{shift.label} total</span>
          <strong className="text-gray-900">{money(thisShiftTotal)}</strong>
        </div>

        {showAddType ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.message('Prototype: add scratch-card type', {
                description: 'Manager maintains card types in the full product.',
              })
            }
          >
            <Plus size={16} /> Add type
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StatChip({ label, value, emphasize }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
      <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className={cn('mt-1 block text-sm', emphasize ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>
        {value}
      </span>
    </div>
  )
}

function WeekOverview({ week, selectedDay, todayDayIndex, onSelectDay }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-500">
          Tap a day to open its scratch-card sales. Staff can only edit today.
        </p>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-left font-semibold">Day</th>
                {SHIFTS.map(s => (
                  <th key={s.key} className="border border-gray-300 bg-gray-50 px-2 py-2 text-center font-semibold">
                    {s.short}
                  </th>
                ))}
                <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-center font-semibold">Total</th>
                <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map(day => {
                const entry = week[day.id]
                const status = dayStatus(entry, day.id, todayDayIndex)
                return (
                  <tr
                    key={day.id}
                    className={cn(
                      'cursor-pointer hover:bg-blue-50/50',
                      selectedDay === day.id && 'bg-blue-50/40',
                    )}
                    onClick={() => onSelectDay(day.id)}
                  >
                    <td className="border border-gray-300 px-2 py-2 font-medium text-gray-900">
                      {day.short} {day.date}
                      {day.id === todayDayIndex ? (
                        <span className="ml-1.5 rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700">
                          Today
                        </span>
                      ) : null}
                    </td>
                    {SHIFTS.map((_, si) => (
                      <td key={si} className="border border-gray-300 px-2 py-2 text-center">
                        {status === 'upcoming' ? '—' : money(shiftTotal(entry, si))}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-2 py-2 text-center font-semibold">
                      {status === 'upcoming' ? '—' : money(dayTotal(entry))}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{statusLabel(status)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 sm:hidden">
          {WEEK_DAYS.map(day => {
            const entry = week[day.id]
            const status = dayStatus(entry, day.id, todayDayIndex)
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                  selectedDay === day.id
                    ? 'border-blue-200 bg-blue-50/60'
                    : 'border-gray-200 bg-white',
                  status === 'complete' && selectedDay !== day.id && 'border-green-200',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{day.name}</p>
                    <span className="text-[11px] text-gray-500">{day.date}</span>
                    {day.id === todayDayIndex ? (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Today
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {status === 'upcoming' ? 'Not yet due' : `Sold ${money(dayTotal(entry))}`}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-gray-500">
                  {statusLabel(status)}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function PrintSheet({ day, dayMeta, storeName, approved, recordedBy, approvedBy, approvedAt }) {
  const total = dayTotal(day)

  return (
    <div className="scratch-print-inner">
      <header className="scratch-print-header">
        <p className="print-brand">Premier Woodgreen | Store Operations</p>
        <h1>Scratch-card sales</h1>
        <p>
          {storeName} · {dayMeta.long}
        </p>
        <div className="scratch-print-meta">
          <span>
            <strong>Recorded by:</strong> {recordedBy || '—'}
          </span>
          <span>
            <strong>Approval:</strong>{' '}
            {approved ? `${approvedBy} · ${approvedAt}` : 'Pending'}
          </span>
          <span>
            <strong>Day total:</strong> {money(total)}
          </span>
        </div>
      </header>

      {SHIFTS.map((shift, si) => (
        <section key={shift.key} className="scratch-print-shift">
          <h2>
            {shift.label} <span>{shift.hours}</span>
            <em>Total {money(shiftTotal(day, si))}</em>
          </h2>
          <table>
            <thead>
              <tr>
                <th className="card">Scratch card</th>
                <th>Token</th>
                <th>Opening</th>
                <th>Closing</th>
                <th>Qty</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {day.rows.map(row => {
                const s = calcShift(row, si)
                return (
                  <tr key={`${shift.key}-${row.name}`}>
                    <td className="card">{row.name}</td>
                    <td>{money(row.token)}</td>
                    <td>{s.open}</td>
                    <td>{s.close}</td>
                    <td>{s.qty}</td>
                    <td>{money(s.val)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="scratch-print-footer">
        <p>
          Opening stock carries forward between shifts. Qty = Opening − Closing. Value = Qty ×
          Token. Day total sold: <strong>{money(total)}</strong>
        </p>
      </footer>
    </div>
  )
}
