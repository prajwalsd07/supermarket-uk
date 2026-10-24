import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Eye, Lock, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { getFlowStep } from '../data/employeeFlow'
import { printPage } from '../lib/print'
import { FormTopBar } from '../components/common/FormTopBar'
import { EmployeeSaveActions } from '../components/common/EmployeeSaveActions'
import { Card, CardContent } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
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

function emptyDay() {
  return {
    problem: '',
    action: '',
    extra: '',
    opening: false,
    closing: false,
    clear: false,
    saved: false,
    recordedBy: null,
  }
}

const initialDays = [
  {
    problem: 'Chiller door seal loose on Chiller 02.',
    action: 'Temporary seal applied and engineer booked for Tuesday.',
    extra: '',
    opening: true,
    closing: true,
    clear: false,
    saved: true,
    recordedBy: 'Isla Brown',
  },
  {
    problem: 'Morning bakery delivery short by 12 loaves.',
    action: 'Noted on delivery log and supplier contacted.',
    extra: '',
    opening: true,
    closing: true,
    clear: false,
    saved: true,
    recordedBy: 'Ethan Clark',
  },
  {
    problem: '',
    action: '',
    extra: '',
    opening: true,
    closing: true,
    clear: true,
    saved: true,
    recordedBy: 'Maya Patel',
  },
  {
    problem: 'Customer reported spill near till 3.',
    action: 'Area cleaned immediately and wet-floor sign placed.',
    extra: 'Checked nearby aisles — no further spill.',
    opening: true,
    closing: true,
    clear: false,
    saved: true,
    recordedBy: 'Isla Brown',
  },
  {
    problem: 'Morning delivery arrived 35 minutes late.',
    action: 'Checked chilled goods on arrival and updated the delivery log.',
    extra: '',
    opening: true,
    closing: true,
    clear: false,
    saved: false,
    recordedBy: null,
  },
  emptyDay(),
  emptyDay(),
]

function dayStatus(entry, dayIndex, todayIndex) {
  if (entry.saved && entry.clear) return 'clear'
  if (entry.saved && entry.problem.trim()) return 'logged'
  if (dayIndex > todayIndex) return 'upcoming'
  if (entry.problem.trim() || entry.clear) return 'draft'
  return 'pending'
}

function statusLabel(status) {
  if (status === 'logged') return 'Problem logged'
  if (status === 'clear') return 'No problems'
  if (status === 'draft') return 'Draft'
  if (status === 'upcoming') return 'Upcoming'
  return 'Not started'
}

export default function ProblemReportPage() {
  const navigate = useNavigate()
  const flow = getFlowStep('/problems')
  const {
    user,
    role,
    store,
    approvals,
    approvalMeta,
    canEditOps,
    isReadOnly,
    canApprove,
    updateProblemsMeta,
    approveProblemsWeek,
  } = useAuth()

  const [days, setDays] = useState(initialDays)
  const [viewMode, setViewMode] = useState('day')
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY)
  const [dirty, setDirty] = useState(false)

  const problemsMeta = approvalMeta.problems
  const approved = approvals.problems
  const editable = canEditOps && !approved && !isReadOnly
  const isStaff = role === 'employee'
  const todayDayIndex = DEMO_DAY
  const dayMeta = WEEK_DAYS[selectedDay]
  const todayMeta = WEEK_DAYS[todayDayIndex]
  const activeDayIndex = selectedDay
  const activeEntry = days[activeDayIndex]
  const canEditActive =
    editable && activeDayIndex === todayDayIndex && !activeEntry.saved && !approved

  const weekStats = useMemo(() => {
    let logged = 0
    let clear = 0
    let pending = 0
    days.forEach((entry, i) => {
      const status = dayStatus(entry, i, todayDayIndex)
      if (status === 'logged') logged += 1
      else if (status === 'clear') clear += 1
      else if (status === 'pending' || status === 'draft') pending += 1
    })
    return { logged, clear, pending }
  }, [days, todayDayIndex])

  const activeStatus = dayStatus(activeEntry, activeDayIndex, todayDayIndex)

  const updateActive = patch => {
    if (!canEditActive) return
    setDirty(true)
    setDays(items =>
      items.map((entry, i) => (i === activeDayIndex ? { ...entry, ...patch } : entry)),
    )
  }

  const save = () => {
    const entry = days[todayDayIndex]
    if (!entry.clear && (!entry.problem.trim() || !entry.action.trim())) {
      toast.error('Enter the problem and action taken, or mark the day as clear')
      return false
    }
    if (!entry.opening || !entry.closing) {
      toast.error('Confirm opening and closing checks before saving')
      return false
    }

    const lastSavedAt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    setDays(items =>
      items.map((day, i) =>
        i === todayDayIndex
          ? {
              ...day,
              saved: true,
              recordedBy: user.name,
              problem: day.clear ? '' : day.problem,
              action: day.clear ? '' : day.action,
            }
          : day,
      ),
    )
    updateProblemsMeta({
      recordedBy: user.name,
      recordedById: user.id,
      lastSavedAt,
    })
    setDirty(false)
    toast.success('Problem report saved')
    return true
  }

  const saveAndContinue = () => {
    if (!save()) return
    toast.message(`Continuing to ${flow.nextLabel}`)
    navigate(flow.next)
  }

  const approveWeek = () => {
    const today = days[todayDayIndex]
    if (!today.saved) {
      toast.error('Today’s report must be saved before approving the week')
      return false
    }
    approveProblemsWeek(user)
    setDirty(false)
    return true
  }

  const printPortraitA4 = () =>
    printPage({
      styleId: 'problem-print-page-size',
      css: `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 0 !important;
        }
        html, body {
          height: 297mm !important;
          max-height: 297mm !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `,
      onBefore: () => document.body.classList.add('printing-problem-report'),
      onAfter: () => document.body.classList.remove('printing-problem-report'),
    })

  return (
    <div className="space-y-4 sm:space-y-6">
      <FormTopBar
        title="Weekly problem report"
        period="Week commencing 31 August 2026"
        storeName={store.name}
        status={
          approved
            ? 'Approved & locked'
            : `${statusLabel(activeStatus)} · ${dayMeta.short}`
        }
        statusType={
          approved
            ? 'approved'
            : activeStatus === 'pending' || activeStatus === 'draft'
              ? 'pending'
              : 'approved'
        }
        approved={approved}
        approveLabel="Approve week"
        onApprove={canApprove ? approveWeek : undefined}
        lastSaved={problemsMeta.lastSavedAt?.split(',').pop()?.trim() || '15:42'}
        onPrint={printPortraitA4}
        headerActions={
          editable && !activeEntry.saved ? (
            <EmployeeSaveActions dirty={dirty || !activeEntry.saved} onSave={save} onSaveAndContinue={saveAndContinue} />
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
              <i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Problem logged
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-green-500" /> Clear day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full border border-dashed border-gray-400 bg-white" />{' '}
              Pending
            </span>
          </div>

          {viewMode === 'day' ? (
            <DayForm
              dayMeta={WEEK_DAYS[activeDayIndex]}
              entry={activeEntry}
              status={activeStatus}
              canEdit={canEditActive}
              locked={Boolean(activeEntry.saved) || approved || isReadOnly}
              onChange={updateActive}
            />
          ) : (
            <WeekList
              days={days}
              selectedDay={activeDayIndex}
              todayDayIndex={todayDayIndex}
              editable={canEditActive}
              onSelectDay={dayId => {
                setSelectedDay(dayId)
                setViewMode('day')
              }}
            />
          )}
        </div>

        <div className="print-only problem-print-sheet">
          <PrintSheet
            days={days}
            storeName={store.name}
            approved={approved}
            recordedBy={problemsMeta.recordedBy}
            approvedBy={problemsMeta.approvedBy}
            approvedAt={problemsMeta.approvedAt}
          />
        </div>
      </FormTopBar>
    </div>
  )
}

function StatsBanner({ stats }) {
  const items = [
    { label: 'Problems logged', value: stats.logged, tone: 'text-amber-700' },
    { label: 'Clear days', value: stats.clear, tone: 'text-green-700' },
    { label: 'Pending days', value: stats.pending, tone: 'text-gray-900' },
    {
      label: 'Covered this week',
      value: stats.logged + stats.clear,
      tone: 'text-blue-700',
    },
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

function DayForm({ dayMeta, entry, status, canEdit, locked, onChange }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-3 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">{dayMeta.long}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {entry.recordedBy
                ? `Recorded by ${entry.recordedBy}`
                : canEdit
                  ? 'Enter today’s problem or mark the day clear'
                  : 'No record yet'}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
              status === 'logged' && 'bg-amber-50 text-amber-800',
              status === 'clear' && 'bg-green-50 text-green-700',
              (status === 'pending' || status === 'draft') && 'bg-gray-100 text-gray-700',
              status === 'upcoming' && 'bg-white text-gray-500 border border-gray-200',
            )}
          >
            {status === 'logged' ? <AlertTriangle size={12} /> : null}
            {status === 'clear' || entry.saved ? <Check size={12} /> : null}
            {statusLabel(status)}
          </span>
        </div>

        <label
          className={cn(
            'flex items-start gap-3 rounded-xl border p-3 text-sm',
            entry.clear ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white',
            !canEdit && 'opacity-90',
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={entry.clear}
            disabled={!canEdit}
            onChange={e => onChange({ clear: e.target.checked })}
          />
          <span>
            <span className="font-medium text-gray-900">No problems today</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Tick this if the store ran normally with nothing to report.
            </span>
          </span>
        </label>

        {!entry.clear ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Problem or change</Label>
              <Textarea
                disabled={!canEdit}
                value={entry.problem}
                onChange={e => onChange({ problem: e.target.value })}
                placeholder="Describe what happened…"
                className="min-h-28"
              />
            </div>
            <div className="space-y-2">
              <Label>Action taken</Label>
              <Textarea
                disabled={!canEdit}
                value={entry.action}
                onChange={e => onChange({ action: e.target.value })}
                placeholder="What did the team do?"
                className="min-h-28"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4 text-sm text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={entry.opening}
              disabled={!canEdit}
              onChange={e => onChange({ opening: e.target.checked })}
            />
            Opening checks completed
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={entry.closing}
              disabled={!canEdit}
              onChange={e => onChange({ closing: e.target.checked })}
            />
            Closing checks completed
          </label>
        </div>

        <div className="space-y-2">
          <Label>Extra checks (optional)</Label>
          <Textarea
            disabled={!canEdit}
            value={entry.extra}
            onChange={e => onChange({ extra: e.target.value })}
            placeholder="Any checks outside the normal routine…"
          />
        </div>

        {locked ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <Lock size={14} /> This day’s record is locked.
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function WeekList({ days, selectedDay, todayDayIndex, onSelectDay }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-500">
          Tap a day to open its report. Staff can only edit today.
        </p>
        <div className="space-y-2">
          {WEEK_DAYS.map(day => {
            const entry = days[day.id]
            const status = dayStatus(entry, day.id, todayDayIndex)
            const isSelected = selectedDay === day.id
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                  isSelected ? 'border-blue-200 bg-blue-50/60' : 'border-gray-200 bg-white hover:bg-gray-50',
                  status === 'logged' && !isSelected && 'border-amber-200',
                  status === 'clear' && !isSelected && 'border-green-200',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md border text-[10px] font-semibold leading-tight',
                    status === 'logged' && 'border-amber-300 bg-amber-50 text-amber-800',
                    status === 'clear' && 'border-green-300 bg-green-50 text-green-700',
                    (status === 'pending' || status === 'draft') &&
                      'border-dashed border-gray-300 bg-white text-gray-500',
                    status === 'upcoming' && 'border-gray-200 bg-gray-50 text-gray-400',
                  )}
                >
                  <span>{day.short}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{day.name}</p>
                    <span className="text-[11px] text-gray-500">{day.date}</span>
                    {day.id === todayDayIndex ? (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Today
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {status === 'clear'
                      ? 'No problems recorded'
                      : status === 'logged' || status === 'draft'
                        ? entry.problem || 'Draft in progress'
                        : status === 'upcoming'
                          ? 'Not yet due'
                          : 'Awaiting report'}
                  </p>
                  {entry.recordedBy ? (
                    <p className="mt-1 text-[11px] text-gray-500">By {entry.recordedBy}</p>
                  ) : null}
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

function PrintSheet({ days, storeName, approved, recordedBy, approvedBy, approvedAt }) {
  const extraChecks = days
    .map((entry, i) => {
      const text = entry.extra?.trim()
      if (!text) return null
      return { day: WEEK_DAYS[i], text, by: entry.recordedBy }
    })
    .filter(Boolean)

  return (
    <div className="problem-print-inner">
      <header className="problem-print-header">
        <p className="print-brand">Premier Woodgreen | Store Operations</p>
        <h1>Weekly problem report</h1>
        <p className="problem-print-sub">
          {storeName} · Week commencing 31 August 2026
          {approved ? ` · Approved by ${approvedBy}` : ' · Approval pending'}
          {recordedBy ? ` · Recorded by ${recordedBy}` : ''}
        </p>
      </header>

      <div className="problem-print-grid">
        {WEEK_DAYS.map(day => {
          const entry = days[day.id]
          const notes = entry.clear
            ? 'No problems recorded.'
            : [entry.problem?.trim(), entry.action?.trim()]
                .filter(Boolean)
                .join(entry.problem?.trim() && entry.action?.trim() ? ' — Action: ' : '') || ''

          return (
            <article key={day.id} className="problem-box">
              <div className="problem-box-top">
                <strong className="problem-box-day">{day.name}</strong>
                <span className="problem-box-prompt">Any problems or changes – what did you do?</span>
                <div className="problem-box-notes">{notes}</div>
              </div>
              <div className="problem-box-checks">
                <label>
                  <span className={entry.opening ? 'tick on' : 'tick'}>{entry.opening ? '✓' : ''}</span>
                  Opening checks
                </label>
                <label>
                  <span className={entry.closing ? 'tick on' : 'tick'}>{entry.closing ? '✓' : ''}</span>
                  Closing checks
                </label>
              </div>
              <div className="problem-box-sign">
                <div>
                  <span>Name</span>
                  <em>{entry.recordedBy || ''}</em>
                </div>
                <div>
                  <span>Signed</span>
                  <em />
                </div>
              </div>
              <p className="problem-box-footer">
                Our safe methods were followed and effectively supervised today.
              </p>
            </article>
          )
        })}

        <article className="problem-box problem-box-extra">
          <div className="problem-box-top">
            <strong className="problem-box-day">EXTRA CHECKS</strong>
            <span className="problem-box-prompt">
              We have performed the following extra checks this week
            </span>
            <div className="problem-box-notes">
              {extraChecks.length
                ? extraChecks.map(item => (
                    <p key={item.day.id}>
                      <strong>{item.day.short}:</strong> {item.text}
                      {item.by ? ` (${item.by})` : ''}
                    </p>
                  ))
                : null}
            </div>
          </div>
          <div className="problem-box-checks problem-box-checks-empty" />
          <div className="problem-box-sign">
            <div>
              <span>Name</span>
              <em>{recordedBy || ''}</em>
            </div>
            <div>
              <span>Signed</span>
              <em />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
