import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Eye, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { getFlowStep } from '../data/employeeFlow'
import { printPage } from '../lib/print'
import { FormTopBar } from '../components/common/FormTopBar'
import { EmployeeSaveActions } from '../components/common/EmployeeSaveActions'
import { FormSelect } from '../components/common/FormSelect'
import { IssueCommentPanel } from '../components/common/IssueCommentPanel'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { cn } from '../components/ui/utils'

const CATEGORIES = [
  { label: 'Chilled foods', range: '0°C – 8°C' },
  { label: 'Fresh meat', range: '0°C – 5°C' },
  { label: 'Frozen foods', range: 'Below −18°C' },
  { label: 'Ice cream', range: 'Below −23°C' },
]

const PERIODS = [
  { key: 'm', label: 'Morning', short: 'M' },
  { key: 'a', label: 'Afternoon', short: 'A' },
  { key: 'e', label: 'Evening', short: 'E' },
]

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

function emptyDay() {
  return ['', '', '']
}

function emptyWeek() {
  return WEEK_DAYS.map(() => emptyDay())
}

function seedWeek(partial) {
  const week = emptyWeek()
  Object.entries(partial).forEach(([day, vals]) => {
    week[Number(day)] = vals
  })
  return week
}

const initialCabinets = [
  {
    number: 1,
    name: 'Chiller 01',
    type: 'Chilled food',
    range: '0°C to 8°C',
    week: seedWeek({
      0: [3.2, 3.8, 3.5],
      1: [3.4, 4.0, 3.6],
      2: [3.1, 3.9, 3.4],
      3: [3.5, 4.2, 3.7],
      4: [3.6, 4.1, 3.8],
    }),
  },
  {
    number: 2,
    name: 'Chiller 02',
    type: 'Chilled food',
    range: '0°C to 8°C',
    week: seedWeek({
      0: [2.8, 3.1, 2.9],
      1: [3.0, 3.3, 3.0],
      2: [2.7, 3.2, 2.8],
      3: [2.9, 3.4, 3.1],
      4: [3.0, 3.5, ''],
    }),
  },
  {
    number: 3,
    name: 'Meat Chiller',
    type: 'Fresh meat',
    range: '0°C to 5°C',
    week: seedWeek({
      0: [1.8, 2.4, 2.0],
      1: [2.0, 2.6, 2.2],
      2: [1.9, 2.5, 2.1],
      3: [2.1, 2.8, 2.3],
      4: [2.4, 3.2, 2.8],
    }),
  },
  {
    number: 4,
    name: 'Dairy 01',
    type: 'Chilled food',
    range: '0°C to 8°C',
    week: seedWeek({
      0: [4.1, 4.5, 4.2],
      1: [4.0, 4.4, 4.1],
      2: [4.2, 4.6, 4.3],
      3: [4.1, 4.8, 4.4],
      4: [4.3, 4.7, ''],
    }),
  },
  {
    number: 5,
    name: 'Freezer 01',
    type: 'Frozen food',
    range: 'Below −18°C',
    week: seedWeek({
      0: [-21.0, -20.5, -21.2],
      1: [-20.8, -20.2, -20.9],
      2: [-21.4, -20.8, -21.0],
      3: [-21.1, -20.6, -21.3],
      4: [-21.2, -20.4, ''],
    }),
  },
  {
    number: 6,
    name: 'Freezer 02',
    type: 'Frozen food',
    range: 'Below −18°C',
    week: seedWeek({
      0: [-20.5, -19.8, -20.1],
      1: [-20.2, -19.5, -20.0],
      2: [-21.0, -20.1, -20.4],
      3: [-20.8, -19.9, -20.2],
      4: [-21.1, -14.2, ''],
    }),
  },
  {
    number: 7,
    name: 'Ice Cream 01',
    type: 'Ice cream',
    range: 'Below −23°C',
    week: seedWeek({
      0: [-24.5, -24.0, -24.2],
      1: [-24.8, -24.1, -24.3],
      2: [-25.0, -24.4, -24.6],
      3: [-24.6, -24.2, -24.5],
      4: [-24.8, -24.1, ''],
    }),
  },
  {
    number: 8,
    name: 'Produce Chiller',
    type: 'Chilled food',
    range: '0°C to 8°C',
    week: seedWeek({
      0: [5.1, 5.4, 5.2],
      1: [5.0, 5.3, 5.1],
      2: [4.9, 5.2, 5.0],
      3: [5.2, 5.5, 5.3],
      4: [5.1, 5.4, ''],
    }),
  },
]

function isUnsafe(type, v) {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  if (Number.isNaN(n)) return false
  if (type === 'Chilled food') return n < 0 || n > 8
  if (type === 'Fresh meat') return n < 0 || n > 5
  if (type === 'Frozen food') return n >= -18
  if (type === 'Ice cream') return n >= -23
  return false
}

function formatTemp(v) {
  if (v === '' || v === null || v === undefined) return ''
  return String(v)
}

export default function TemperaturePage() {
  const navigate = useNavigate()
  const flow = getFlowStep('/temperature')
  const {
    user,
    role,
    store,
    approvals,
    approvalMeta,
    canEditOps,
    isReadOnly,
    canApprove,
    updateTemperatureMeta,
    approveTemperatureWeek,
  } = useAuth()
  const [cabinets, setCabinets] = useState(initialCabinets)
  const [viewMode, setViewMode] = useState('day')
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY)
  const [dirty, setDirty] = useState(false)
  const [action, setAction] = useState(
    'Stock moved to Freezer 01. Unit isolated and engineer contacted.',
  )

  const tempMeta = approvalMeta.temperature
  const approved = approvals.temperature
  const editable = canEditOps && !approved && !isReadOnly
  const isStaff = role === 'employee'
  const todayDayIndex = DEMO_DAY
  const todayMeta = WEEK_DAYS[todayDayIndex]

  const unsafeIssues = useMemo(
    () =>
      cabinets.flatMap(c =>
        c.week.flatMap((dayVals, di) =>
          dayVals.flatMap((v, pi) =>
            isUnsafe(c.type, v)
              ? [
                  `${c.name} was recorded at ${v}°C on ${WEEK_DAYS[di].name} ${PERIODS[pi].label.toLowerCase()}, outside its safe range.`,
                ]
              : [],
          ),
        ),
      ),
    [cabinets],
  )
  const hasUnsafe = unsafeIssues.length > 0

  const filledCount = useMemo(() => {
    let filled = 0
    let total = 0
    cabinets.forEach(c => {
      c.week[todayDayIndex].forEach(v => {
        total += 1
        if (v !== '') filled += 1
      })
    })
    return { filled, total }
  }, [cabinets, todayDayIndex])

  const updateReading = (cabinetIndex, dayIndex, periodIndex, raw) => {
    if (isStaff && dayIndex !== todayDayIndex) return
    if (!editable) return
    const next = raw === '' ? '' : Number(raw)
    setDirty(true)
    setCabinets(items =>
      items.map((cab, ci) => {
        if (ci !== cabinetIndex) return cab
        const week = cab.week.map((day, di) => {
          if (di !== dayIndex) return day
          return day.map((val, pi) => (pi === periodIndex ? next : val))
        })
        return { ...cab, week }
      }),
    )
  }

  const save = () => {
    const dayUnsafe = cabinets.some(c =>
      c.week[todayDayIndex].some(v => isUnsafe(c.type, v)),
    )
    if (dayUnsafe && !action.trim()) {
      toast.error('Corrective action is required for unsafe readings')
      return false
    }
    const lastSavedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    updateTemperatureMeta({
      recordedBy: user.name,
      recordedById: user.id,
      lastSavedAt,
    })
    setDirty(false)
    toast.success('Temperature readings saved')
    return true
  }

  const saveAndContinue = () => {
    if (!save()) return
    toast.message(`Continuing to ${flow.nextLabel}`)
    navigate(flow.next)
  }

  const approveWeek = () => {
    if (hasUnsafe && !action.trim()) {
      toast.error('Resolve unsafe readings with corrective action before approval')
      return false
    }
    approveTemperatureWeek(user)
    setDirty(false)
    return true
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <FormTopBar
        title="Weekly temperature checklist"
        period="Week commencing 31 August 2026"
        storeName={store.name}
        status={
          approved
            ? 'Approved & locked'
            : `${filledCount.filled} of ${filledCount.total} for ${todayMeta.short}`
        }
        statusType={approved ? 'approved' : 'pending'}
        approved={approved}
        approveLabel="Approve week"
        onApprove={canApprove ? approveWeek : undefined}
        lastSaved={tempMeta.lastSavedAt?.split(',').pop()?.trim() || '15:42'}
        onPrint={() => printPage()}
        headerActions={
          editable ? (
            <EmployeeSaveActions dirty={dirty} onSave={save} onSaveAndContinue={saveAndContinue} />
          ) : null
        }
      >
        <div className="no-print space-y-2.5 sm:space-y-4">
          <CategoryBanner />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-800 sm:px-3 sm:py-2 sm:text-sm">
              <span className="font-semibold">{isStaff ? 'Today' : 'Viewing'}</span>
              <span className="mx-1 text-blue-300 sm:mx-1.5">·</span>
              <span className="text-blue-800/90">
                {todayMeta.short} {todayMeta.date}
              </span>
            </div>

            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-100 p-0.5 sm:w-auto sm:p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode('day')
                  setSelectedDay(todayDayIndex)
                }}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none',
                  viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600',
                )}
              >
                {isStaff ? <Pencil size={14} /> : <Eye size={14} />} Today
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none',
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600',
                )}
              >
                <Eye size={14} /> Week
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 sm:gap-y-1.5 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-green-500" /> Safe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Outside range
            </span>
          </div>

          {viewMode === 'day' ? (
            <DayTable
              cabinets={cabinets}
              dayIndex={todayDayIndex}
              editable={editable}
              onChange={updateReading}
            />
          ) : (
            <WeekTable
              cabinets={cabinets}
              selectedDay={todayDayIndex}
              editable={editable}
              editableDayIndex={isStaff ? todayDayIndex : null}
              onChange={updateReading}
              screen
            />
          )}

          <IssueCommentPanel
            id="temperature-action"
            issues={unsafeIssues}
            value={action}
            disabled={approved || role === 'administrator'}
            onChange={value => {
              setAction(value)
              if (editable || role === 'manager') setDirty(true)
            }}
          />
        </div>

        <div className="print-only temp-print-sheet">
          <PrintSheet
            cabinets={cabinets}
            storeName={store.name}
            approved={approved}
            recordedBy={tempMeta.recordedBy}
            approvedBy={tempMeta.approvedBy}
            approvedAt={tempMeta.approvedAt}
          />
        </div>
      </FormTopBar>
    </div>
  )
}

function CategoryBanner() {
  return (
    <Card className="gap-0 sm:gap-6">
      <CardContent className="grid grid-cols-2 gap-1.5 p-2 sm:gap-3 sm:p-4 lg:grid-cols-4">
        {CATEGORIES.map(cat => (
          <div key={cat.label} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 sm:px-3 sm:py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
              {cat.label}
            </p>
            <p className="text-xs font-bold text-gray-900 sm:text-sm">{cat.range}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DayTable({ cabinets, dayIndex, editable, onChange }) {
  const [periodIndex, setPeriodIndex] = useState(0)
  const period = PERIODS[periodIndex]

  return (
    <Card className="gap-0 sm:gap-6">
      <CardContent className="space-y-2.5 p-2.5 sm:space-y-4 sm:p-6">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <FormSelect
            id="temp-period"
            label="Check period"
            value={String(periodIndex)}
            onValueChange={v => setPeriodIndex(Number(v))}
            placeholder="Select period"
            triggerClassName="w-full sm:w-56"
            options={PERIODS.map((p, i) => ({ value: String(i), label: p.label }))}
          />
          <p className="text-[11px] text-gray-500 sm:pb-1 sm:text-sm">
            {editable ? (
              <>
                Entering <strong className="text-gray-800">{period.label}</strong> only
              </>
            ) : (
              <>
                Viewing <strong className="text-gray-800">{period.label}</strong> (read-only)
              </>
            )}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {cabinets.map((cabinet, ci) => {
            const value = cabinet.week[dayIndex][periodIndex]
            return (
              <div
                key={cabinet.number}
                className="flex items-center gap-2 rounded-xl border border-gray-200 p-2.5 sm:grid sm:grid-cols-[1fr_180px] sm:items-center sm:gap-3 sm:p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    <span className="mr-1 text-gray-400 sm:mr-1.5">#{cabinet.number}</span>
                    {cabinet.name}
                  </p>
                  <p className="text-[10px] text-gray-500 sm:text-xs">
                    {cabinet.type} · {cabinet.range}
                  </p>
                </div>
                <div className="w-[7.5rem] shrink-0 sm:w-auto">
                  <TempCell
                    label="°C"
                    value={value}
                    type={cabinet.type}
                    editable={editable}
                    showLabel
                    onChange={raw => onChange(ci, dayIndex, periodIndex, raw)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WeekTable({ cabinets, selectedDay, editable, editableDayIndex = null, onChange, screen }) {
  return (
    <Card>
      <CardContent className="p-0 sm:p-2">
        <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500 sm:hidden">
          Swipe sideways to see the full week
        </p>
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[980px] border-collapse text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-10 border border-gray-300 bg-gray-50 px-2 py-2 text-left font-semibold text-gray-900"
                >
                  Cabinet
                </th>
                {WEEK_DAYS.map(day => (
                  <th
                    key={day.id}
                    colSpan={3}
                    className={cn(
                      'border border-gray-300 px-1 py-2 text-center font-semibold',
                      screen && selectedDay === day.id ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-900',
                    )}
                  >
                    <div>{day.name}</div>
                    <div className="font-normal text-[10px] opacity-80">{day.date}</div>
                  </th>
                ))}
              </tr>
              <tr>
                {WEEK_DAYS.flatMap(day =>
                  PERIODS.map(p => (
                    <th
                      key={`${day.id}-${p.key}`}
                      className={cn(
                        'border border-gray-300 px-0.5 py-1 text-center font-medium uppercase tracking-wide',
                        screen && selectedDay === day.id ? 'bg-blue-50/70 text-blue-700' : 'bg-white text-gray-500',
                      )}
                    >
                      {p.short}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {cabinets.map((cabinet, ci) => (
                <tr key={cabinet.number}>
                  <td className="sticky left-0 z-10 border border-gray-300 bg-white px-2 py-1.5 text-left font-medium text-gray-900">
                    <span className="text-gray-400">#{cabinet.number}</span> {cabinet.name}
                    <div className="text-[10px] font-normal text-gray-500">{cabinet.type}</div>
                  </td>
                  {cabinet.week.flatMap((dayVals, di) =>
                    dayVals.map((v, pi) => {
                      const unsafe = isUnsafe(cabinet.type, v)
                      const cellEditable =
                        editable && (editableDayIndex == null || di === editableDayIndex)
                      return (
                        <td
                          key={`${di}-${pi}`}
                          className={cn(
                            'border border-gray-300 p-0.5 text-center',
                            screen && selectedDay === di && 'bg-blue-50/40',
                            unsafe && 'bg-red-50',
                            editable && editableDayIndex != null && di !== editableDayIndex && 'bg-gray-50/80',
                          )}
                        >
                          {cellEditable ? (
                            <input
                              type="number"
                              step="0.1"
                              value={v}
                              placeholder="—"
                              onChange={e => onChange(ci, di, pi, e.target.value)}
                              className={cn(
                                'h-7 w-full min-w-[2.4rem] border-0 bg-transparent px-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-400',
                                unsafe && 'font-semibold text-red-700',
                              )}
                            />
                          ) : (
                            <span className={cn('inline-block px-1 py-1', unsafe && 'font-semibold text-red-700')}>
                              {formatTemp(v) || '—'}
                            </span>
                          )}
                        </td>
                      )
                    }),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function TempCell({ label, value, type, editable, onChange, showLabel }) {
  const unsafe = isUnsafe(type, value)
  return (
    <label
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border px-3 py-2',
        unsafe
          ? 'border-red-200 bg-red-50'
          : value === ''
            ? 'border-dashed border-gray-300 bg-gray-50'
            : 'border-green-200 bg-green-50',
      )}
    >
      {showLabel ? (
        <span className="shrink-0 text-xs font-medium text-gray-500 sm:hidden">{label}</span>
      ) : null}
      {editable ? (
        <Input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="h-9 bg-white text-base sm:h-8 sm:text-sm"
          value={value}
          placeholder="—"
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <strong className="text-sm">{value === '' ? '—' : `${value}°`}</strong>
      )}
      {unsafe ? (
        <AlertTriangle size={14} className="shrink-0 text-red-600" />
      ) : value !== '' ? (
        <Check size={14} className="shrink-0 text-green-600" />
      ) : null}
    </label>
  )
}

function PrintSheet({ cabinets, storeName, approved, recordedBy, approvedBy, approvedAt }) {
  return (
    <div className="temp-print-inner">
      <p className="print-brand">Premier Woodgreen | Store Operations</p>
      <h1 className="temp-print-title">Daily chilled and frozen temperature checklist</h1>
      <div className="temp-print-meta">
        <span>
          <strong>Store:</strong> {storeName}
        </span>
        <span>
          <strong>Week commencing:</strong> 31 August 2026
        </span>
      </div>

      <div className="temp-print-cats">
        {CATEGORIES.map(cat => (
          <div key={cat.label}>
            <strong>{cat.label.toUpperCase()}</strong>
            <span>{cat.range}</span>
          </div>
        ))}
      </div>

      <div className="temp-print-approval-meta">
        <span>
          <strong>Recorded by:</strong> {recordedBy || '—'}
        </span>
        <span>
          <strong>Manager approval:</strong>{' '}
          {approved ? `${approvedBy} · ${approvedAt}` : 'Pending'}
        </span>
      </div>

      <p className="temp-print-section">Shop floor refrigeration</p>

      <table className="temp-print-table">
        <thead>
          <tr>
            <th rowSpan={2}>Cabinet number</th>
            {WEEK_DAYS.map(day => (
              <th key={day.id} colSpan={3}>
                {day.name}
                <br />
                <span>{day.date}</span>
              </th>
            ))}
          </tr>
          <tr>
            {WEEK_DAYS.flatMap(day =>
              PERIODS.map(p => (
                <th key={`${day.id}-${p.key}`} className="slot">
                  {p.label}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {cabinets.map(cabinet => (
            <tr key={cabinet.number}>
              <td className="cab">
                {cabinet.number}
                <span className="cab-name">{cabinet.name}</span>
              </td>
              {cabinet.week.flatMap((dayVals, di) =>
                dayVals.map((v, pi) => (
                  <td key={`${di}-${pi}`} className={isUnsafe(cabinet.type, v) ? 'unsafe' : ''}>
                    {formatTemp(v)}
                  </td>
                )),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="temp-print-footer">
        <p>
          Unsafe readings are highlighted and require corrective action. Manager approval locks the weekly report.
        </p>
      </div>
    </div>
  )
}
