import {
  AlertTriangle,
  ReceiptPoundSterling,
  Sparkles,
  Thermometer,
} from 'lucide-react'
import { DEMO_DATE, activityRows } from './seed'

/**
 * Staff daily workflows — shared shape for employee + manager UIs.
 * Later: replace getManagerOpsDashboard() with GET /stores/:id/ops-dashboard
 */
export const STAFF_WORKFLOWS = [
  {
    id: 'temperature',
    path: '/temperature',
    title: 'Temperature checks',
    shortTitle: 'Temperature',
    icon: Thermometer,
  },
  {
    id: 'cleaning',
    path: '/cleaning',
    title: 'Cleaning schedule',
    shortTitle: 'Cleaning',
    icon: Sparkles,
  },
  {
    id: 'problems',
    path: '/problems',
    title: 'Problem report',
    shortTitle: 'Problems',
    icon: AlertTriangle,
  },
  {
    id: 'balance',
    path: '/balance',
    title: 'Scratch-card sales',
    shortTitle: 'Scratch cards',
    icon: ReceiptPoundSterling,
  },
]

/** Demo progress / exceptions — becomes API fields later */
const WORKFLOW_DEMO = {
  temperature: {
    progressLabel: '5 of 8 cabinets logged',
    done: 5,
    total: 8,
    detail: 'Afternoon round in progress',
    alert: {
      title: 'Unsafe freezer reading',
      detail: 'Freezer 02 · −14.2°C · Friday afternoon',
    },
  },
  cleaning: {
    progressLabel: '5 of 7 areas done',
    done: 5,
    total: 7,
    detail: '2 areas still open today',
    alert: {
      title: '2 cleaning items missed',
      detail: 'Back store and waste area',
    },
  },
  problems: {
    progressLabel: 'Today draft ready',
    done: 0,
    total: 1,
    detail: 'Delivery delay logged — not saved yet',
    alert: null,
  },
  balance: {
    progressLabel: '£125.00 sold today',
    done: 1,
    total: 1,
    detail: 'All three shifts entered',
    alert: null,
  },
}

/**
 * Builds a manager ops dashboard payload from store approvals.
 * Swap this for a fetch() when the backend is ready — keep the return shape stable.
 *
 * @returns {{
 *   storeId: string,
 *   date: string,
 *   summary: {
 *     workflowsTotal: number,
 *     workflowsApproved: number,
 *     workflowsPendingApproval: number,
 *     openAlerts: number,
 *     staffOnShift: number,
 *     staffTotal: number,
 *   },
 *   workflows: Array<object>,
 *   attention: Array<object>,
 *   activity: Array<[string, string, string, string]>,
 * }}
 */
export function getManagerOpsDashboard({ storeId, approvals, approvalMeta }) {
  const workflows = STAFF_WORKFLOWS.map(wf => {
    const demo = WORKFLOW_DEMO[wf.id]
    const approved = Boolean(approvals?.[wf.id])
    const meta = approvalMeta?.[wf.id] || {}
    const hasAlert = Boolean(demo.alert) && !approved

    let status = 'in_progress'
    let statusLabel = demo.progressLabel
    if (approved) {
      status = 'approved'
      statusLabel = 'Approved'
    } else if (hasAlert) {
      status = 'alert'
      statusLabel = 'Needs review'
    } else if (wf.id === 'balance' || wf.id === 'problems') {
      status = 'pending_approval'
      statusLabel = 'Awaiting approval'
    } else {
      status = 'in_progress'
      statusLabel = demo.progressLabel
    }

    return {
      id: wf.id,
      path: wf.path,
      title: wf.title,
      shortTitle: wf.shortTitle,
      icon: wf.icon,
      status,
      statusLabel,
      detail: approved
        ? `Approved by ${meta.approvedBy || 'manager'}${meta.approvedAt ? ` · ${meta.approvedAt}` : ''}`
        : demo.detail,
      progress: { done: demo.done, total: demo.total },
      recordedBy: meta.recordedBy || null,
      lastSavedAt: meta.lastSavedAt || null,
      approved,
      alert: hasAlert ? demo.alert : null,
      canApprove: !approved,
    }
  })

  const attention = []
  workflows.forEach(wf => {
    if (wf.alert) {
      attention.push({
        id: `${wf.id}-alert`,
        workflowId: wf.id,
        path: wf.path,
        icon: wf.icon,
        urgent: true,
        title: wf.alert.title,
        detail: wf.alert.detail,
        badgeType: 'alert',
        badgeLabel: 'Urgent',
      })
    } else if (!wf.approved) {
      attention.push({
        id: `${wf.id}-review`,
        workflowId: wf.id,
        path: wf.path,
        icon: wf.icon,
        urgent: false,
        title: `${wf.title} ready to review`,
        detail: wf.recordedBy
          ? `Last saved by ${wf.recordedBy}${wf.lastSavedAt ? ` · ${wf.lastSavedAt.split(',').pop()?.trim()}` : ''}`
          : wf.detail,
        badgeType: 'pending',
        badgeLabel: 'Review',
      })
    }
  })

  return {
    storeId,
    date: DEMO_DATE,
    summary: {
      workflowsTotal: workflows.length,
      workflowsApproved: workflows.filter(w => w.approved).length,
      workflowsPendingApproval: workflows.filter(w => !w.approved).length,
      openAlerts: workflows.filter(w => w.alert).length,
      staffOnShift: 3,
      staffTotal: 4,
    },
    workflows,
    attention,
    activity: activityRows,
  }
}
