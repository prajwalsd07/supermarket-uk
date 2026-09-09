export const EMPLOYEE_FLOW = [
  {
    path: '/temperature',
    label: 'Temperature checks',
    next: '/cleaning',
    nextLabel: 'Cleaning',
  },
  {
    path: '/cleaning',
    label: 'Cleaning schedule',
    next: '/problems',
    nextLabel: 'Problem report',
  },
  {
    path: '/problems',
    label: 'Problem report',
    next: '/balance',
    nextLabel: 'Scratch-card sales',
  },
  {
    path: '/balance',
    label: 'Scratch-card sales',
    next: '/',
    nextLabel: 'Overview',
  },
]

export function getFlowStep(path) {
  return EMPLOYEE_FLOW.find(step => step.path === path)
}
