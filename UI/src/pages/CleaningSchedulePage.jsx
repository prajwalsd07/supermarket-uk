import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { getFlowStep } from '../data/employeeFlow'
import { printPage } from '../lib/print'
import { FormTopBar } from '../components/common/FormTopBar'
import { EmployeeSaveActions } from '../components/common/EmployeeSaveActions'
import { IssueCommentPanel } from '../components/common/IssueCommentPanel'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
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

/** 1 = done, 0 = pending, -1 = missed */
const initialTasks = [
  { name: 'Shop floor swept & mopped', area: 'Front of house', done: [1, 1, 1, 1, 1, 0, 0] },
  { name: 'Equipment sinks', area: 'Prep', done: [1, 1, 1, 1, 1, 0, 0] },
  { name: 'Hand-wash basin', area: 'Prep', done: [1, 1, 1, 1, 1, 0, 0] },
  { name: 'Work surfaces', area: 'Prep', done: [1, 1, 1, 1, 0, 0, 0] },
  { name: 'Back store', area: 'Storage', done: [1, 1, 1, 1, -1, 0, 0] },
  { name: 'Waste area', area: 'External', done: [1, 1, 1, 1, -1, 0, 0] },
  { name: 'Oven & trays', area: 'Bakery', done: [1, 1, 1, 1, 1, 0, 0] },
]

function initialsFromName(name) {
  if (!name) return '—'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

export default function CleaningSchedulePage() {
  const navigate = useNavigate()
  const flow = getFlowStep('/cleaning')
  const {
    user,
    role,
    store,
    approvals,
    approvalMeta,
    canEditOps,
    isReadOnly,
    canApprove,
    updateCleaningMeta,
    approveCleaningWeek,
  } = useAuth()

  const [tasks, setTasks] = useState(initialTasks)
  const [viewMode, setViewMode] = useState('day')
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY)
  const [dirty, setDirty] = useState(false)
  const [comment, setComment] = useState('')

  const cleanMeta = approvalMeta.cleaning
  const approved = approvals.cleaning
  const editable = canEditOps && !approved && !isReadOnly
  const isStaff = role === 'employee'
  const todayDayIndex = DEMO_DAY
  const dayMeta = WEEK_DAYS[selectedDay]
  const todayMeta = WEEK_DAYS[todayDayIndex]
  const activeDayIndex = isStaff ? todayDayIndex : selectedDay

  const dayStats = useMemo(() => {
    let done = 0
    let missed = 0
    let pending = 0
    tasks.forEach(task => {
      const state = task.done[activeDayIndex]
      if (state === 1) done += 1
      else if (state === -1) missed += 1
      else pending += 1
    })
    return { done, missed, pending, total: tasks.length }
  }, [tasks, activeDayIndex])

  const missedIssues = useMemo(
    () =>
      tasks.flatMap(task =>
        task.done.flatMap((state, di) =>
          state === -1 ? [`${task.name} (${task.area}) was missed on ${WEEK_DAYS[di].name}.`] : [],
        ),
      ),
    [tasks],
  )
  const weekMissed = missedIssues.length

  const toggleDay = (taskIndex, dayIndex) => {
    if (!editable) return
    if (isStaff && dayIndex !== todayDayIndex) return
    setDirty(true)
    setTasks(items =>
      items.map((task, i) => {
        if (i !== taskIndex) return task
        const current = task.done[dayIndex]
        const next = current === 1 ? 0 : 1
        return {
          ...task,
          done: task.done.map((d, di) => (di === dayIndex ? next : d)),
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
    updateCleaningMeta({
      recordedBy: user.name,
      recordedById: user.id,
      lastSavedAt,
    })
    setDirty(false)
    toast.success('Cleaning schedule saved')
    return true
  }

  const saveAndContinue = () => {
    if (!save()) return
    toast.message(`Continuing to ${flow.nextLabel}`)
    navigate(flow.next)
  }

  const approveWeek = () => {
    if (weekMissed > 0 && !comment.trim()) {
      toast.error('Add a comment for missed cleaning items before approving the week')
      return false
    }
    approveCleaningWeek(user)
    setDirty(false)
    return true
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <FormTopBar
        title="Weekly cleaning schedule"
        period="Week commencing 31 August 2026"
        storeName={store.name}
        status={
          approved
            ? 'Approved & locked'
            : `${dayStats.done} of ${dayStats.total} for ${dayMeta.short}`
        }
        statusType={approved ? 'approved' : dayStats.missed > 0 ? 'alert' : 'pending'}
        approved={approved}
        approveLabel="Approve week"
        onApprove={canApprove ? approveWeek : undefined}
        lastSaved={cleanMeta.lastSavedAt?.split(',').pop()?.trim() || '15:42'}
        onPrint={() => printPage()}
        headerActions={
          editable ? (
            <EmployeeSaveActions dirty={dirty} onSave={save} onSaveAndContinue={saveAndContinue} />
          ) : null
        }
      >
        <div className="no-print space-y-3 sm:space-y-4">
          <StatsBanner stats={dayStats} weekMissed={weekMissed} />

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
              <i className="h-2.5 w-2.5 rounded-full bg-green-500" /> Done
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Missed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full border border-dashed border-gray-400 bg-white" />{' '}
              Pending
            </span>
          </div>

          {viewMode === 'day' ? (
            <DayChecklist
              tasks={tasks}
              dayIndex={activeDayIndex}
              editable={editable}
              userInitials={initialsFromName(user?.name)}
              onToggle={taskIndex => toggleDay(taskIndex, activeDayIndex)}
            />
          ) : (
            <WeekTable
              tasks={tasks}
              selectedDay={activeDayIndex}
              editable={editable}
              editableDayIndex={isStaff ? todayDayIndex : null}
              userInitials={initialsFromName(user?.name)}
              onToggle={toggleDay}
            />
          )}

          {role === 'manager' && !approved ? (
            <div className="no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTasks(x => [
                    ...x,
                    {
                      name: 'New cleaning area',
                      area: 'General',
                      done: [0, 0, 0, 0, 0, 0, 0],
                    },
                  ])
                  setDirty(true)
                  toast.success('Cleaning item added')
                }}
              >
                <Plus size={16} /> Add item
              </Button>
            </div>
          ) : null}

          <IssueCommentPanel
            id="cleaning-comment"
            issues={missedIssues}
            title="Missed cleaning items"
            label="Comment"
            value={comment}
            disabled={approved || role === 'administrator'}
            onChange={value => {
              setComment(value)
              if (editable || role === 'manager') setDirty(true)
            }}
          />
        </div>

        {role === 'manager' || role === 'administrator' ? (
          <div className="print-only temp-print-sheet cleaning-print-sheet">
            <PrintSheet
              tasks={tasks}
              storeName={store.name}
              recordedBy={cleanMeta.recordedBy}
            />
          </div>
        ) : null}
      </FormTopBar>
    </div>
  )
}

function StatsBanner({ stats, weekMissed }) {
  const items = [
    { label: 'Done today', value: stats.done, tone: 'text-green-700' },
    { label: 'Pending today', value: stats.pending, tone: 'text-gray-900' },
    { label: 'Missed today', value: stats.missed, tone: 'text-red-700' },
    { label: 'Missed this week', value: weekMissed, tone: 'text-red-700' },
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

function DayChecklist({ tasks, dayIndex, editable, userInitials, onToggle }) {
  return (
    <Card>
      <CardContent className="space-y-2.5 p-3 sm:space-y-3 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-500">
          {editable ? (
            <>
              Tick each area cleaned today. You can untick if marked by mistake.
            </>
          ) : (
            <>Viewing today&apos;s cleaning checklist (read-only).</>
          )}
        </p>

        <div className="space-y-2.5 sm:space-y-3">
          {tasks.map((task, ti) => {
            const state = task.done[dayIndex]
            const done = state === 1
            const missed = state === -1
            return (
              <button
                key={task.name}
                type="button"
                disabled={!editable}
                onClick={() => onToggle(ti)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                  done
                    ? 'border-green-200 bg-green-50'
                    : missed
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white',
                  editable && 'hover:border-blue-300 hover:bg-blue-50/40',
                  !editable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                    done
                      ? 'border-green-600 bg-green-600 text-white'
                      : missed
                        ? 'border-red-400 bg-white text-red-600'
                        : 'border-dashed border-gray-300 bg-white text-transparent',
                  )}
                  aria-hidden
                >
                  {done ? <Check size={14} /> : missed ? <X size={14} /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{task.name}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{task.area}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-gray-500">
                  {done ? userInitials : missed ? 'Missed' : 'To do'}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WeekTable({
  tasks,
  selectedDay,
  editable,
  editableDayIndex = null,
  userInitials,
  onToggle,
}) {
  return (
    <Card>
      <CardContent className="p-0 sm:p-2">
        <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500 sm:hidden">
          Swipe sideways to see the full week
        </p>
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border border-gray-300 bg-gray-50 px-2 py-2 text-left font-semibold text-gray-900">
                  Area
                </th>
                {WEEK_DAYS.map(day => (
                  <th
                    key={day.id}
                    className={cn(
                      'border border-gray-300 px-1 py-2 text-center font-semibold',
                      selectedDay === day.id ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-900',
                    )}
                  >
                    <div>{day.short}</div>
                    <div className="font-normal text-[10px] opacity-80">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, ti) => (
                <tr key={task.name}>
                  <td className="sticky left-0 z-10 border border-gray-300 bg-white px-2 py-1.5 text-left font-medium text-gray-900">
                    {task.name}
                    <div className="text-[10px] font-normal text-gray-500">{task.area}</div>
                  </td>
                  {task.done.map((state, di) => {
                    const cellEditable =
                      editable && (editableDayIndex == null || di === editableDayIndex)
                    const done = state === 1
                    const missed = state === -1
                    return (
                      <td
                        key={di}
                        className={cn(
                          'border border-gray-300 p-1 text-center',
                          selectedDay === di && 'bg-blue-50/40',
                          missed && 'bg-red-50',
                          editable && editableDayIndex != null && di !== editableDayIndex && 'bg-gray-50/80',
                        )}
                      >
                        {cellEditable ? (
                          <button
                            type="button"
                            aria-label={done ? 'Mark pending' : 'Mark done'}
                            onClick={() => onToggle(ti, di)}
                            className={cn(
                              'mx-auto flex h-8 w-8 items-center justify-center rounded-md border transition',
                              done
                                ? 'border-green-600 bg-green-600 text-white'
                                : missed
                                  ? 'border-red-300 bg-white text-red-600 hover:border-green-500'
                                  : 'border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50',
                            )}
                          >
                            {done ? <Check size={14} /> : missed ? <X size={14} /> : null}
                          </button>
                        ) : done ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
                            <Check size={12} /> {userInitials}
                          </span>
                        ) : missed ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                            <X size={12} /> Missed
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Print / PDF only — monthly paper schedule for managers.
 * On-screen UI stays Today / Week. Demo month: September 2026.
 * Week data Mon 31 Aug–Sun 6 Sep maps onto Sep 1–6 (Tue–Sun); Mon 31 Aug is prior month.
 */
const PRINT_MONTH = {
  label: 'September 2026',
  year: 2026,
  monthIndex: 8, // September
  daysInMonth: 30,
}

/** Weekday letters for 1–30 Sep 2026 (1 = Tue … 30 = Wed) */
const SEP_2026_WEEKDAYS = [
  'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S',
  'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W',
]

/**
 * Map a September day number to the demo week cell, or a light fill for earlier weeks.
 * task.done indices: 0=Mon 31 Aug … 6=Sun 6 Sep
 */
function monthCellState(task, dayOfMonth) {
  // Sep 1–6 = week Tue–Sun (indices 1–6)
  if (dayOfMonth >= 1 && dayOfMonth <= 6) {
    return task.done[dayOfMonth] ?? 0
  }
  // Earlier full weeks in September (before demo “today” Fri 4): not applicable for days > 6
  // Later days in month: blank for the prototype
  if (dayOfMonth > 6 && dayOfMonth <= 30) {
    // Fill prior calendar weeks (7–3 Sep already covered). Weeks ending before “today”
    // aren’t in this demo week — leave empty so the PDF shows a true month grid.
    return 0
  }
  return 0
}

function PrintSheet({ tasks, storeName, recordedBy }) {
  const days = Array.from({ length: PRINT_MONTH.daysInMonth }, (_, i) => i + 1)

  return (
    <div className="temp-print-inner">
      <p className="print-brand">Premier Woodgreen | Store Operations</p>
      <h1 className="temp-print-title">Monthly cleaning schedule</h1>
      <div className="temp-print-meta">
        <span>
          <strong>Store:</strong> {storeName}
        </span>
        <span>
          <strong>Month:</strong> {PRINT_MONTH.label}
        </span>
        <span>
          <strong>Recorded by:</strong> {recordedBy || '—'}
        </span>
      </div>

      <p className="temp-print-section">Area checklist · {PRINT_MONTH.label}</p>

      <table className="temp-print-table cleaning-month-table">
        <thead>
          <tr>
            <th className="cab">Area</th>
            {days.map(day => (
              <th key={day} className="slot">
                {day}
                <br />
                <span>{SEP_2026_WEEKDAYS[day - 1]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.name}>
              <td className="cab">
                <strong className="cleaning-area-name">{task.name}</strong>
                {task.area ? <span className="cab-name">{task.area}</span> : null}
              </td>
              {days.map(day => {
                const state = monthCellState(task, day)
                return (
                  <td key={day} className={state === -1 ? 'unsafe' : ''}>
                    {state === 1 ? '✓' : state === -1 ? '×' : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="temp-print-footer">
        <p>✓ = cleaned · × = missed · blank = not due / not recorded.</p>
      </div>
    </div>
  )
}
