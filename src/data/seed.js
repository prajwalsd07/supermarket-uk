export const stores = [
  { id: 'camden', name: 'Camden High Street', code: 'ST-001', manager: 'Olivia Martin' },
  { id: 'brixton', name: 'Brixton Road', code: 'ST-002', manager: 'Daniel Cooper' },
  { id: 'greenwich', name: 'Greenwich Market', code: 'ST-003', manager: 'Amelia Jones' },
  { id: 'richmond', name: 'Richmond Central', code: 'ST-004', manager: 'Noah Wilson' },
]

export const demoUsers = {
  EMP001: { pin: '1234', name: 'Maya Patel', role: 'employee', storeId: 'camden', title: 'Store employee' },
  EMP002: { pin: '1234', name: 'Ethan Clark', role: 'employee', storeId: 'camden', title: 'Store employee' },
  EMP003: { pin: '1234', name: 'Isla Brown', role: 'employee', storeId: 'camden', title: 'Store employee' },
  EMP004: { pin: '1234', name: 'Leo Wright', role: 'employee', storeId: 'camden', title: 'Store employee' },
  MGR001: { pin: '2468', name: 'Olivia Martin', role: 'manager', storeId: 'camden', title: 'Store manager' },
  ADMIN: { pin: '9999', name: 'Alex Morgan', role: 'administrator', storeId: 'camden', title: 'Administrator' },
}

export const money = value =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0))

export const formatToday = () =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

export const DEMO_DATE = 'Friday, 4 September 2026'
export const DEMO_WEEK = 'Week commencing 31 August 2026'

export const activityRows = [
  ['15:42', 'Temperature reading added', 'Maya Patel', 'Afternoon check'],
  ['14:18', 'Cleaning item completed', 'Ethan Clark', 'Shop floor'],
  ['12:05', 'Scratch-card sales updated', 'Maya Patel', 'Morning shift'],
  ['09:11', 'Opening problem recorded', 'Isla Brown', 'Delivery delay'],
]

export const reportRows = [
  ['Day-end report', '4 Sep 2026', 'Maya Patel', 'Awaiting approval', 'pending'],
  ['Scratch-card sales', '4 Sep 2026', 'Maya Patel', 'Awaiting approval', 'pending'],
  ['Temperature checklist', '31 Aug–6 Sep', 'Store team', 'In progress', 'draft'],
  ['Problem report', '31 Aug–6 Sep', 'Isla Brown', 'Signed off', 'approved'],
  ['Cleaning schedule', 'August 2026', 'Store team', 'Approved', 'approved'],
  ['Staff training', '28 Aug 2026', 'Olivia Martin', 'Completed', 'approved'],
]

export const allUsersList = [
  ['Olivia Martin', 'MGR001', 'Manager', 'Camden High Street', 'Active'],
  ['Maya Patel', 'EMP001', 'Employee', 'Camden High Street', 'Active'],
  ['Ethan Clark', 'EMP002', 'Employee', 'Camden High Street', 'Active'],
  ['Isla Brown', 'EMP003', 'Employee', 'Camden High Street', 'Active'],
  ['Leo Wright', 'EMP004', 'Employee', 'Camden High Street', 'Active'],
  ['Daniel Cooper', 'MGR002', 'Manager', 'Brixton Road', 'Active'],
  ['Amelia Jones', 'MGR003', 'Manager', 'Greenwich Market', 'Active'],
  ['Noah Wilson', 'MGR004', 'Manager', 'Richmond Central', 'Active'],
  ['Alex Morgan', 'ADMIN', 'Administrator', 'All stores', 'Active'],
]

export const camdenEmployees = ['Maya Patel', 'Ethan Clark', 'Isla Brown', 'Leo Wright']

export const defaultApprovals = {
  balance: false,
  dayend: false,
  temperature: false,
  cleaning: false,
  problems: false,
}

export const defaultApprovalMeta = {
  temperature: {
    recordedBy: 'Maya Patel',
    recordedById: 'EMP001',
    lastSavedAt: '4 Sep 2026, 15:42',
    approvedBy: null,
    approvedAt: null,
  },
  cleaning: {
    recordedBy: 'Maya Patel',
    recordedById: 'EMP001',
    lastSavedAt: '4 Sep 2026, 15:42',
    approvedBy: null,
    approvedAt: null,
  },
  problems: {
    recordedBy: 'Maya Patel',
    recordedById: 'EMP001',
    lastSavedAt: '4 Sep 2026, 15:42',
    approvedBy: null,
    approvedAt: null,
  },
  balance: {
    recordedBy: 'Maya Patel',
    recordedById: 'EMP001',
    lastSavedAt: '4 Sep 2026, 15:42',
    approvedBy: null,
    approvedAt: null,
  },
}
