import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getManagerOpsDashboard, STAFF_WORKFLOWS } from '../data/managerDashboard'
import { DEMO_DATE, reportRows } from '../data/seed'
import { BroadcastPanel } from '../components/broadcast/BroadcastPanel'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn } from '../components/ui/utils'

export default function DashboardPage() {
  const { role, store, user, approvals, approvalMeta } = useAuth()
  if (role === 'employee') return <EmployeeDashboard store={store} user={user} approvals={approvals} />
  if (role === 'administrator') return <AdminDashboard store={store} />
  return <ManagerDashboard store={store} approvals={approvals} approvalMeta={approvalMeta} />
}

function EmployeeDashboard({ store, user, approvals }) {
  const navigate = useNavigate()
  const taskMeta = {
    temperature: {
      detail: 'Afternoon round due by 16:00',
      status: 'alert',
      label: '3 of 4 complete',
    },
    cleaning: {
      detail: 'Today’s assigned areas',
      status: 'pending',
      label: '5 of 8 complete',
    },
    problems: {
      detail: 'Log issues or changes for today',
      status: 'pending',
      label: 'Not started',
    },
    balance: {
      detail: 'Morning shift · 08:00–14:00',
      status: approvals.balance ? 'approved' : 'draft',
      label: approvals.balance ? 'Approved' : 'Continue',
    },
  }
  const tasks = STAFF_WORKFLOWS.map(wf => ({
    ...wf,
    ...taskMeta[wf.id],
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good afternoon, ${user.name.split(' ')[0]}`}
        description={`Here’s what needs attention today at ${store.name}.`}
      />

      <BroadcastPanel />

      <Card className="overflow-hidden border-0 bg-linear-to-br from-blue-600 to-blue-800 text-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Daily process</p>
            <h3 className="mt-1 text-xl font-semibold">Start today’s store checks</h3>
            <p className="mt-1 text-sm text-blue-100">
              Temperature → Cleaning → Problem report → Scratch-card sales
            </p>
            <Button
              variant="secondary"
              className="mt-4 bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => navigate('/temperature')}
            >
              Start process <ArrowRight size={16} />
            </Button>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-300/40 text-2xl font-bold">
            {STAFF_WORKFLOWS.length}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Today’s work</h3>
          <p className="text-sm text-gray-500">{DEMO_DATE.split(',')[0]}, 4 September</p>
        </div>
        <StatusBadge type="approved">
          <Check size={12} /> 2 completed
        </StatusBadge>
      </div>

      <div className="grid gap-3">
        {tasks.map(task => (
          <button
            key={task.id}
            type="button"
            onClick={() => navigate(task.path)}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50"
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                task.status === 'alert'
                  ? 'bg-red-50 text-red-600'
                  : task.status === 'approved'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-600',
              )}
            >
              <task.icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-gray-900">{task.title}</span>
              <span className="block text-sm text-gray-500">{task.detail}</span>
            </span>
            <StatusBadge type={task.status}>{task.label}</StatusBadge>
            <ArrowRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Your entries are securely recorded</p>
          <p className="text-blue-800">Each completed check includes your name, date and time.</p>
        </div>
      </div>
    </div>
  )
}

function ManagerDashboard({ store, approvals, approvalMeta }) {
  const navigate = useNavigate()
  /** Later: const data = await fetch(`/api/stores/${store.id}/ops-dashboard`).then(r => r.json()) */
  const data = getManagerOpsDashboard({
    storeId: store.id,
    approvals,
    approvalMeta,
  })
  const { summary, workflows, attention, activity } = data

  const metrics = [
    {
      label: 'Awaiting approval',
      shortLabel: 'Awaiting',
      value: summary.workflowsPendingApproval,
      note: `of ${summary.workflowsTotal} staff workflows`,
      icon: ClipboardCheck,
      tone: 'amber',
    },
    {
      label: 'Approved today',
      shortLabel: 'Approved',
      value: summary.workflowsApproved,
      note: `${summary.workflowsTotal - summary.workflowsApproved} still open`,
      icon: CheckCircle2,
      tone: 'green',
    },
    {
      label: 'Open alerts',
      shortLabel: 'Alerts',
      value: summary.openAlerts,
      note: summary.openAlerts ? 'Needs manager action' : 'None right now',
      icon: AlertTriangle,
      tone: summary.openAlerts ? 'red' : 'green',
    },
    {
      label: 'Staff on shift',
      shortLabel: 'On shift',
      value: `${summary.staffOnShift}/${summary.staffTotal}`,
      note: 'Store team today',
      icon: Users,
      tone: 'blue',
    },
  ]

  const approvalPct = Math.round((summary.workflowsApproved / summary.workflowsTotal) * 100)

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        title={store.name}
        description={`Staff workflows for ${data.date}. Review, then approve when ready.`}
        className="[&_p]:hidden sm:[&_p]:block"
      />

      <BroadcastPanel />

      <MetricGrid metrics={metrics} compact />

      {/* Mobile: slim approval strip */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">Approval progress</p>
          <p className="text-sm font-semibold text-blue-700">
            {summary.workflowsApproved}/{summary.workflowsTotal} · {approvalPct}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-blue-600"
            style={{ width: `${approvalPct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {workflows.map(wf => (
            <span
              key={wf.id}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium',
                wf.approved
                  ? 'bg-green-50 text-green-700'
                  : wf.alert
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-800',
              )}
            >
              {wf.shortTitle}
            </span>
          ))}
        </div>
      </div>

      <Card className="gap-3 sm:gap-6">
        <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-2 sm:items-start">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Today’s staff workflows</CardTitle>
              <CardDescription className="hidden sm:block">
                Same checks staff complete: Temperature → Cleaning → Problems → Scratch-card sales.
              </CardDescription>
            </div>
            <StatusBadge type={summary.workflowsPendingApproval ? 'pending' : 'approved'}>
              {summary.workflowsApproved}/{summary.workflowsTotal}
            </StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-3 sm:space-y-2 sm:px-6 sm:pb-6">
          {workflows.map(wf => (
            <button
              key={wf.id}
              type="button"
              onClick={() => navigate(wf.path)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 text-left transition hover:bg-gray-50 sm:gap-3 sm:p-4"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
                  wf.status === 'alert'
                    ? 'bg-red-50 text-red-600'
                    : wf.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-600',
                )}
              >
                <wf.icon size={16} className="sm:hidden" />
                <wf.icon size={18} className="hidden sm:block" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900 sm:text-base">
                  <span className="sm:hidden">{wf.shortTitle}</span>
                  <span className="hidden sm:inline">{wf.title}</span>
                </span>
                <span className="hidden text-sm text-gray-500 sm:block">{wf.detail}</span>
                {wf.recordedBy ? (
                  <span className="mt-0.5 hidden text-[11px] text-gray-400 sm:block">
                    Last by {wf.recordedBy}
                    {wf.lastSavedAt ? ` · ${wf.lastSavedAt}` : ''}
                  </span>
                ) : null}
              </span>
              <StatusBadge
                type={
                  wf.status === 'alert'
                    ? 'alert'
                    : wf.status === 'approved'
                      ? 'approved'
                      : 'pending'
                }
              >
                <span className="sm:hidden">
                  {wf.approved ? 'Done' : wf.alert ? 'Alert' : 'Open'}
                </span>
                <span className="hidden sm:inline">{wf.statusLabel}</span>
              </StatusBadge>
              <ArrowRight size={16} className="hidden shrink-0 text-gray-400 sm:block" />
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-6 lg:grid-cols-5">
        <Card className="gap-3 sm:gap-6 lg:col-span-3">
          <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between gap-2 sm:items-start">
              <div>
                <CardTitle className="text-base sm:text-lg">Needs your attention</CardTitle>
                <CardDescription className="hidden sm:block">
                  Alerts and items waiting for manager review.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 pb-3 sm:space-y-2 sm:px-6 sm:pb-6">
            {attention.length ? (
              attention.map(item => (
                <AttentionRow
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  icon={item.icon}
                  urgent={item.urgent}
                  title={item.title}
                  detail={item.detail}
                  badge={<StatusBadge type={item.badgeType}>{item.badgeLabel}</StatusBadge>}
                />
              ))
            ) : (
              <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-sm text-green-800">
                All staff workflows are clear — nothing waiting for review.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hidden gap-6 lg:col-span-2 sm:flex sm:flex-col">
          <CardHeader className="px-6 pt-6">
            <CardTitle>Approval progress</CardTitle>
            <CardDescription>Based on the four daily staff workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.workflowsApproved}
                  <span className="text-lg font-semibold text-gray-400">/{summary.workflowsTotal}</span>
                </p>
                <p className="text-sm text-gray-500">workflows approved</p>
              </div>
              <p className="text-sm font-semibold text-blue-700">{approvalPct}%</p>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100">
              <div
                className="h-2.5 rounded-full bg-blue-600 transition-all"
                style={{ width: `${approvalPct}%` }}
              />
            </div>
            <ul className="space-y-2">
              {workflows.map(wf => (
                <li key={wf.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-700">{wf.shortTitle}</span>
                  <span
                    className={cn(
                      'font-medium',
                      wf.approved ? 'text-green-700' : wf.alert ? 'text-red-600' : 'text-amber-700',
                    )}
                  >
                    {wf.approved ? 'Approved' : wf.alert ? 'Alert' : 'Open'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 sm:gap-6">
        <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">Store activity</CardTitle>
          <CardDescription className="hidden sm:block">
            Latest staff actions on today’s workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          {/* Mobile compact list */}
          <div className="space-y-1.5 sm:hidden">
            {activity.map(row => (
              <div
                key={`${row[0]}-${row[1]}`}
                className="flex items-start gap-2 rounded-lg border border-gray-200 px-2.5 py-2"
              >
                <span className="shrink-0 text-[11px] font-medium text-gray-500">{row[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{row[1]}</p>
                  <p className="text-[11px] text-gray-500">
                    {row[2]} · {row[3]}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Team member</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map(row => (
                  <TableRow key={`${row[0]}-${row[1]}`}>
                    {row.map((cell, i) => (
                      <TableCell key={i}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminDashboard({ store }) {
  const navigate = useNavigate()
  const metrics = [
    { label: 'Today’s completion', value: '86%', note: '18 of 21 checks', icon: CheckCircle2, tone: 'green' },
    { label: 'Awaiting approval', value: '3', note: 'Manager actions', icon: Clock3, tone: 'amber' },
    { label: 'Active alerts', value: '1', note: 'Temperature', icon: AlertTriangle, tone: 'red' },
    { label: 'Active staff', value: '5', note: '1 manager · 4 employees', icon: Users, tone: 'blue' },
  ]
  const health = [
    ['Sales & cash', 92],
    ['Food safety', 84],
    ['Cleaning', 76],
    ['Staff training', 100],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store network"
        description="Select a supermarket to view its operational summary."
      />

      <BroadcastPanel />

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Viewing store</p>
            <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-500">
              {store.code} · Manager: {store.manager}
            </p>
          </div>
          <StatusBadge type="approved">Operating normally</StatusBadge>
        </CardContent>
      </Card>

      <MetricGrid metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Recent reports</CardTitle>
                <CardDescription>Read-only store records.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportRows.slice(0, 4).map(row => (
              <div
                key={row[0]}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{row[0]}</p>
                  <p className="text-xs text-gray-500">{row[1]}</p>
                </div>
                <StatusBadge type={row[4]}>{row[3]}</StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Store health</CardTitle>
            <CardDescription>Current status by area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-700">{label}</span>
                  <strong className="text-gray-900">{value}%</strong>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricGrid({ metrics, compact = false }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  return (
    <div
      className={cn(
        'grid grid-cols-2 xl:grid-cols-4',
        compact ? 'gap-2 sm:gap-4' : 'gap-4',
      )}
    >
      {metrics.map(item => (
        <Card key={item.label} className={compact ? 'gap-0 sm:gap-6' : undefined}>
          <CardContent
            className={cn(
              'flex items-start gap-2 sm:gap-3',
              compact ? 'p-3 sm:p-5' : 'p-5',
            )}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg',
                compact ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10',
                tones[item.tone],
              )}
            >
              <item.icon size={compact ? 16 : 18} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 sm:text-xs">
                <span className="sm:hidden">{item.shortLabel || item.label}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </p>
              <p className={cn('font-bold text-gray-900', compact ? 'text-xl sm:text-2xl' : 'text-2xl')}>
                {item.value}
              </p>
              <p className="hidden text-xs text-gray-500 sm:block">{item.note}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AttentionRow({ onClick, icon: Icon, title, detail, badge, urgent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left hover:bg-gray-50 sm:gap-3 sm:px-3 sm:py-3"
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
          urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700',
        )}
      >
        <Icon size={16} className="sm:hidden" />
        <Icon size={18} className="hidden sm:block" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900 sm:text-base">{title}</span>
        <span className="block text-[11px] text-gray-500 sm:text-sm">{detail}</span>
      </span>
      {badge}
    </button>
  )
}
