import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, FileDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { camdenEmployees, DEMO_DATE } from '../data/seed'
import { printPage } from '../lib/print'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../components/ui/utils'

const TOPIC_TEMPLATE = [
  { name: 'Hand washing', status: true, date: '22 Aug 2026' },
  { name: 'Cleaning effectively', status: true, date: '22 Aug 2026' },
  { name: 'Personal hygiene', status: true, date: '22 Aug 2026' },
  { name: 'Chilled storage & display', status: false, date: '—' },
  { name: 'Customer service', status: false, date: '—' },
  { name: 'Fire safety', status: true, date: '23 Aug 2026' },
]

/** Demo completion masks per employee (true = completed) */
const COMPLETION_MASKS = {
  'Maya Patel': [true, true, true, false, false, true],
  'Ethan Clark': [true, true, true, true, true, true],
  'Isla Brown': [true, true, true, true, true, false],
  'Leo Wright': [true, true, true, false, false, false],
}

const DATES = ['22 Aug 2026', '22 Aug 2026', '22 Aug 2026', '23 Aug 2026', '24 Aug 2026', '23 Aug 2026']

function buildEmployeeTopics(name) {
  const mask = COMPLETION_MASKS[name] || TOPIC_TEMPLATE.map(t => t.status)
  return TOPIC_TEMPLATE.map((topic, i) => ({
    name: topic.name,
    status: Boolean(mask[i]),
    date: mask[i] ? DATES[i] : '—',
  }))
}

function buildInitialRecords() {
  return Object.fromEntries(camdenEmployees.map(name => [name, buildEmployeeTopics(name)]))
}

function employeeIdFor(name) {
  return `EMP00${camdenEmployees.indexOf(name) + 1}`
}

export default function TrainingPage() {
  const { role, store, user } = useAuth()
  const [selected, setSelected] = useState('Maya Patel')
  const [records, setRecords] = useState(buildInitialRecords)
  const [printChecked, setPrintChecked] = useState(() =>
    Object.fromEntries(camdenEmployees.map(name => [name, name === 'Maya Patel'])),
  )

  const editable = role === 'manager'
  const canPrint = role === 'manager' || role === 'administrator'
  const topics = records[selected] || []
  const completed = topics.filter(t => t.status).length
  const employeeId = employeeIdFor(selected)
  const checkedNames = useMemo(
    () => camdenEmployees.filter(name => printChecked[name]),
    [printChecked],
  )

  const selectEmployee = name => {
    setSelected(name)
    // Viewing an employee also includes them in the next print
    setPrintChecked(prev => ({ ...prev, [name]: true }))
  }

  const togglePrintCheck = (name, checked) => {
    setPrintChecked(prev => ({ ...prev, [name]: checked }))
  }

  const toggleTopic = i => {
    if (!editable) return
    setRecords(prev => ({
      ...prev,
      [selected]: prev[selected].map((a, n) =>
        n === i
          ? {
              ...a,
              status: !a.status,
              date: !a.status ? '4 Sep 2026' : '—',
            }
          : a,
      ),
    }))
  }

  const printEmployees = useMemo(
    () =>
      checkedNames.map(name => {
        const list = records[name] || []
        return {
          name,
          id: employeeIdFor(name),
          topics: list,
          completed: list.filter(t => t.status).length,
        }
      }),
    [checkedNames, records],
  )

  const handlePrint = () => {
    if (printEmployees.length === 0) {
      toast.error('Tick at least one employee to print')
      return
    }
    // Defer print one frame so the print sheet reflects the latest checked list
    requestAnimationFrame(() => {
      printPage({
        portrait: true,
        styleId: 'training-print-page-size',
        css: `
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 0 !important;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `,
      })
    })
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="no-print">
        <PageHeader
          title="Training record"
          description="Store-specific training and completion status."
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              {canPrint ? (
                <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrint}>
                  <FileDown size={16} /> Print
                  {printEmployees.length > 0 ? ` (${printEmployees.length})` : ''}
                </Button>
              ) : null}
              {editable ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setRecords(prev => ({
                      ...prev,
                      [selected]: [
                        ...prev[selected],
                        { name: 'New training topic', status: false, date: '—' },
                      ],
                    }))
                    toast.success('Training topic added')
                  }}
                >
                  <Plus size={16} /> Add topic
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="no-print space-y-3 sm:space-y-6">
        {canPrint ? (
          <p className="text-xs text-gray-500 sm:text-sm">
            Tick employees to include in the PDF, then press Print.
          </p>
        ) : null}

        {/* Mobile: horizontal employee chips */}
        <div className="lg:hidden">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Employees · {camdenEmployees.length} active
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {camdenEmployees.map(name => {
              const initials = name
                .split(' ')
                .map(x => x[0])
                .join('')
              const active = selected === name
              const done = (records[name] || []).filter(t => t.status).length
              const total = (records[name] || []).length
              return (
                <div
                  key={name}
                  className={cn(
                    'flex min-w-[10.5rem] shrink-0 items-center gap-2 rounded-lg border px-2 py-2',
                    active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white',
                  )}
                >
                  {canPrint ? (
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-blue-600"
                      checked={Boolean(printChecked[name])}
                      onChange={e => togglePrintCheck(name, e.target.checked)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Include ${name} in print`}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => selectEmployee(name)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                        active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700',
                      )}
                    >
                      {initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {name.split(' ')[0]}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        {done} of {total}
                      </span>
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:gap-6 lg:grid-cols-5">
          <Card className="hidden gap-0 lg:col-span-2 lg:flex lg:flex-col">
            <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Employees</CardTitle>
              <CardDescription>
                {canPrint
                  ? 'Tick to print · click name to view'
                  : '4 active team members'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 sm:px-6 sm:pb-6">
              {camdenEmployees.map(name => {
                const done = (records[name] || []).filter(t => t.status).length
                const total = (records[name] || []).length
                return (
                  <div
                    key={name}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2.5 transition',
                      selected === name
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    {canPrint ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-blue-600"
                        checked={Boolean(printChecked[name])}
                        onChange={e => togglePrintCheck(name, e.target.checked)}
                        aria-label={`Include ${name} in print`}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => selectEmployee(name)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {name
                          .split(' ')
                          .map(x => x[0])
                          .join('')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-gray-900">{name}</span>
                        <span className="block text-xs text-gray-500">
                          {done} of {total} completed
                        </span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="gap-3 sm:gap-6 lg:col-span-3">
            <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white sm:h-12 sm:w-12 sm:text-sm">
                  {selected
                    .split(' ')
                    .map(x => x[0])
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">{selected}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {employeeId}
                    <span className="hidden sm:inline"> · Employee ID</span>
                  </CardDescription>
                </div>
                <StatusBadge type="pending">
                  <span className="sm:hidden">
                    {completed}/{topics.length}
                  </span>
                  <span className="hidden sm:inline">
                    {completed} of {topics.length} complete
                  </span>
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="mb-1 hidden grid-cols-[1fr_160px_120px] gap-3 border-b border-gray-100 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:grid">
                <span>Training topic</span>
                <span>Status</span>
                <span>Completion date</span>
              </div>

              <div className="space-y-2 sm:hidden">
                {topics.map((topic, i) => (
                  <div
                    key={`${topic.name}${i}`}
                    className="rounded-lg border border-gray-200 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <strong className="min-w-0 text-sm leading-snug text-gray-900">
                        {topic.name}
                      </strong>
                      <span className="shrink-0 text-[11px] text-gray-500">{topic.date}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => toggleTopic(i)}
                      className={cn(
                        'mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-70',
                        topic.status
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600',
                      )}
                    >
                      {topic.status ? (
                        <>
                          <CheckCircle2 size={14} /> Completed
                        </>
                      ) : (
                        <>
                          <Clock3 size={14} /> Not started
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden divide-y divide-gray-100 sm:block">
                {topics.map((topic, i) => (
                  <div
                    key={`${topic.name}${i}`}
                    className="grid grid-cols-[1fr_160px_120px] items-center gap-3 py-3"
                  >
                    <strong className="text-sm text-gray-900">{topic.name}</strong>
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => toggleTopic(i)}
                      className={cn(
                        'inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-70',
                        topic.status
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600',
                      )}
                    >
                      {topic.status ? (
                        <>
                          <CheckCircle2 size={14} /> Completed
                        </>
                      ) : (
                        <>
                          <Clock3 size={14} /> Not started
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-600">{topic.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {canPrint ? (
        <div className="print-only training-print-sheet">
          <PrintSheet
            storeName={store.name}
            printedBy={user?.name || '—'}
            employees={printEmployees}
          />
        </div>
      ) : null}
    </div>
  )
}

function chunkEmployees(list, size = 3) {
  const pages = []
  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size))
  }
  return pages
}

function PrintSheet({ storeName, printedBy, employees }) {
  const pages = chunkEmployees(employees, 3)

  return (
    <div className="training-print-inner">
      {pages.map((pageEmployees, pageIndex) => {
        const isLast = pageIndex === pages.length - 1
        const isFull = pageEmployees.length === 3
        const isContinued = pageIndex > 0
        return (
          <div
            key={`page-${pageIndex}`}
            className={[
              'training-print-page',
              isFull ? 'training-print-page--full' : '',
              isLast ? 'training-print-page--last' : '',
              isContinued ? 'training-print-page--continued' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {pageIndex === 0 ? (
              <header className="training-print-header">
                <p className="print-brand">Premier Woodgreen | Store Operations</p>
                <h1>Staff training record</h1>
                <p>
                  {storeName} · {DEMO_DATE}
                </p>
                <div className="training-print-meta">
                  <span>
                    <strong>Employees included:</strong>{' '}
                    {employees.map(e => e.name).join(', ')}
                  </span>
                  <span>
                    <strong>Printed by:</strong> {printedBy}
                  </span>
                </div>
              </header>
            ) : null}

            <div className="training-print-list">
              {pageEmployees.map(emp => (
                <section key={emp.id} className="training-print-employee">
                  <h2>
                    {emp.name} <span>{emp.id}</span>
                    <em>
                      {emp.completed} of {emp.topics.length} complete
                    </em>
                  </h2>
                  <table>
                    <thead>
                      <tr>
                        <th className="topic">Training topic</th>
                        <th>Status</th>
                        <th>Completion date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.topics.map((topic, i) => (
                        <tr key={`${emp.id}-${topic.name}-${i}`}>
                          <td className="topic">{topic.name}</td>
                          <td>{topic.status ? 'Completed' : 'Not started'}</td>
                          <td>{topic.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="training-print-signoff">
                    <div>
                      <span>Employee</span>
                      <em />
                      <span>Manager</span>
                      <em />
                      <span>Date</span>
                      <em className="short" />
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}



