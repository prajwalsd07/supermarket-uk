import { useState } from 'react'
import { ArrowRight, Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { DEMO_DATE, money } from '../data/seed'
import { printPage } from '../lib/print'
import { FormTopBar } from '../components/common/FormTopBar'
import { IssueCommentPanel } from '../components/common/IssueCommentPanel'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { cn } from '../components/ui/utils'

/** Simple demo figures so the cash maths is easy to follow */
const DEFAULTS = {
  sales: 200,
  card: 80,
  voucher: 20,
  cashHand: 60,
  cashBF: 200,
  cashIn: [{ description: 'Float adjustment', amount: 20 }],
  cashOut: [{ description: 'Local supplies', amount: 15 }],
  paid: [
    { description: 'Lottery settlement', amount: 10 },
    { description: 'Supplier payment', amount: 25 },
    { description: 'Staff refreshments', amount: 5 },
  ],
  services: {
    Oyster: [160, 165],
    PayPoint: [1200, 1200],
    Lottery: [30, 30],
    /** Matches today’s Scratch-card sales total on the balance page */
    'Scratch Card': [125, 125],
    Payzone: [300, 300],
  },
}

export default function DayEndReportPage() {
  const { role, store, approvals, setApprovals, canEditOps, isReadOnly } = useAuth()
  const [sales, setSales] = useState(DEFAULTS.sales)
  const [card, setCard] = useState(DEFAULTS.card)
  const [voucher, setVoucher] = useState(DEFAULTS.voucher)
  const [cashHand, setCashHand] = useState(DEFAULTS.cashHand)
  const [cashIn, setCashIn] = useState(DEFAULTS.cashIn)
  const [cashOut, setCashOut] = useState(DEFAULTS.cashOut)
  const [paid, setPaid] = useState(DEFAULTS.paid)
  const [services, setServices] = useState(DEFAULTS.services)
  const [comment, setComment] = useState('')

  const editable = canEditOps && !approvals.dayend && !isReadOnly
  const partA = paid.reduce((s, x) => s + Number(x.amount || 0), 0)
  const expected = Number(sales) - partA - Number(card) - Number(voucher)
  const difference = Number(cashHand) - expected
  const cashBF = DEFAULTS.cashBF
  const cashInTotal = cashIn.reduce((s, x) => s + Number(x.amount || 0), 0)
  const cashOutTotal = cashOut.reduce((s, x) => s + Number(x.amount || 0), 0)
  const totalCash = cashBF + Number(cashHand) + cashInTotal
  const cashCF = totalCash - cashOutTotal

  const issues = [
    ...(difference < 0 ? [`Cash is short by ${money(Math.abs(difference))} against expected cash.`] : []),
    ...Object.entries(services).flatMap(([name, [actual, till]]) => {
      const diff = Number(till) - Number(actual)
      return diff === 0
        ? []
        : [`${name} till reading is ${diff > 0 ? 'over' : 'under'} actual by ${money(Math.abs(diff))}.`]
    }),
  ]

  const approveDayEnd = () => {
    if (issues.length && !comment.trim()) {
      toast.error('Add a comment explaining the differences before approving')
      return false
    }
    setApprovals(x => ({ ...x, dayend: true }))
    return true
  }

  const numberField = (value, setter) =>
    editable ? (
      <MoneyInput value={value} onChange={setter} />
    ) : (
      <strong className="text-gray-900">{money(value)}</strong>
    )

  const printPortraitA4 = () => printPage({ portrait: true, styleId: 'dayend-print-page-size' })

  const printData = {
    storeName: store.name,
    period: DEMO_DATE,
    approved: approvals.dayend,
    sales,
    card,
    voucher,
    cashHand,
    cashBF,
    paid,
    cashIn,
    cashOut,
    services,
    partA,
    expected,
    difference,
    cashInTotal,
    cashOutTotal,
    cashCF,
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <FormTopBar
        title="Day-end report"
        period={`${DEMO_DATE} · Final shift`}
        storeName={store.name}
        approved={approvals.dayend}
        onApprove={role === 'manager' ? approveDayEnd : undefined}
        onPrint={printPortraitA4}
      >
        <div className="no-print grid gap-3 sm:gap-6 xl:grid-cols-2">
          <Card className="gap-3 sm:gap-6">
            <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Sales reconciliation</CardTitle>
              <CardDescription className="hidden sm:block">Closing sales and payment totals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 sm:space-y-4 sm:px-6 sm:pb-6">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:py-3">
                <Label>Sales</Label>
                <div className="w-32 sm:w-40">{numberField(sales, setSales)}</div>
              </div>

              <SectionHead label="Part A · Deductions" value={money(partA)} />
              <LineItems items={paid} setItems={setPaid} editable={editable} />

              <SectionHead label="Part B · Payments" value={money(Number(card) + Number(voucher))} />
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Card</Label>
                  {numberField(card, setCard)}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Voucher</Label>
                  {numberField(voucher, setVoucher)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 sm:gap-3 sm:p-4">
                <CalcBlock
                  label={<><span className="sm:hidden">Expected</span><span className="hidden sm:inline">Expected cash</span></>}
                  value={money(expected)}
                />
                <CalcBlock
                  label={<><span className="sm:hidden">In hand</span><span className="hidden sm:inline">Physical cash in hand</span></>}
                  value={numberField(cashHand, setCashHand)}
                />
                <div
                  className={cn(
                    'rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2',
                    difference >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
                  )}
                >
                  <p className="text-[10px] sm:text-xs text-gray-600">
                    <span className="sm:hidden">{difference >= 0 ? 'Over' : 'Short'}</span>
                    <span className="hidden sm:inline">Cash {difference >= 0 ? 'over' : 'short'}</span>
                  </p>
                  <p
                    className={cn(
                      'text-sm font-bold sm:text-lg',
                      difference >= 0 ? 'text-green-700' : 'text-red-700',
                    )}
                  >
                    {difference >= 0 ? '+' : '−'}
                    {money(Math.abs(difference))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="order-first gap-3 sm:gap-6 xl:order-none">
            <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">Service reconciliation</CardTitle>
              <CardDescription className="hidden sm:block">Till reading minus actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3 sm:space-y-3 sm:px-6 sm:pb-6">
              {Object.entries(services).map(([name, vals]) => {
                const diff = vals[1] - vals[0]
                return (
                  <div
                    key={name}
                    className="rounded-lg border border-gray-200 p-2.5 sm:grid sm:grid-cols-4 sm:items-center sm:gap-2 sm:p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 sm:mb-0 sm:block">
                      <strong className="text-sm text-gray-900">{name}</strong>
                      <span
                        className={cn(
                          'text-xs font-semibold sm:hidden',
                          diff === 0 ? 'text-gray-600' : 'text-amber-700',
                        )}
                      >
                        {diff >= 0 ? '+' : '−'}
                        {money(Math.abs(diff))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:contents">
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs">
                          Actual
                          {name === 'Scratch Card' ? (
                            <span className="ml-1 hidden font-normal text-gray-400 sm:inline">
                              (from sales)
                            </span>
                          ) : null}
                        </Label>
                        {editable && name !== 'Scratch Card' ? (
                          <MoneyInput
                            value={vals[0]}
                            onChange={v => setServices(x => ({ ...x, [name]: [v, vals[1]] }))}
                          />
                        ) : (
                          <MoneyInput value={vals[0]} disabled />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs">Till reading</Label>
                        {editable ? (
                          <MoneyInput
                            value={vals[1]}
                            onChange={v => setServices(x => ({ ...x, [name]: [vals[0], v] }))}
                          />
                        ) : (
                          <MoneyInput value={vals[1]} disabled />
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'hidden text-sm font-semibold sm:block sm:text-right',
                        diff === 0 ? 'text-gray-700' : 'text-amber-700',
                      )}
                    >
                      {diff >= 0 ? '+' : '−'}
                      {money(Math.abs(diff))}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="no-print mt-3 gap-3 sm:mt-6 sm:gap-6">
          <CardHeader className="flex flex-col gap-2 px-3 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-6 sm:pt-6">
            <div>
              <CardTitle className="text-base sm:text-lg">Running cash balance</CardTitle>
              <CardDescription className="hidden sm:block">
                Cash brought forward, movements and closing balance.
              </CardDescription>
            </div>
            <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 sm:block sm:w-auto sm:px-3 sm:py-2 sm:text-right">
              <p className="shrink-0 text-xs text-gray-500">Cash C/F</p>
              <p className="text-base font-bold text-gray-900 sm:mt-0.5 sm:text-lg">{money(cashCF)}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3 sm:space-y-4 sm:px-6 sm:pb-6">
            {/* Mobile: compact 2×3 summary grid */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <CashPill label="Cash B/F" value={money(cashBF)} />
              <CashPill label="Cash in hand" value={money(cashHand)} />
              <CashPill label="Cash in" value={money(cashInTotal)} />
              <CashPill label="Cash out" value={money(cashOutTotal)} />
              <CashPill label="Cash C/F" value={money(cashCF)} highlight className="col-span-2" />
            </div>

            {/* Desktop: original formula strip */}
            <div className="hidden flex-wrap items-center gap-2 text-sm sm:flex">
              <CashPill label="Cash B/F" value={money(cashBF)} />
              <Plus size={14} className="text-gray-400" />
              <CashPill label="Cash in hand" value={money(cashHand)} />
              <Plus size={14} className="text-gray-400" />
              <CashPill label="Cash in" value={money(cashInTotal)} />
              <Minus size={14} className="text-gray-400" />
              <CashPill label="Cash outgoing" value={money(cashOutTotal)} />
              <ArrowRight size={14} className="text-gray-400" />
              <CashPill label="Cash C/F" value={money(cashCF)} highlight />
            </div>

            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <div>
                <SectionHead label="Cash in" />
                <LineItems items={cashIn} setItems={setCashIn} editable={editable} />
              </div>
              <div>
                <SectionHead label="Cash outgoing" />
                <LineItems items={cashOut} setItems={setCashOut} editable={editable} />
              </div>
            </div>

            {editable ? (
              <div className="flex sm:justify-end">
                <Button className="w-full sm:w-auto" onClick={() => toast.success('Day-end report saved')}>
                  Save progress
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <IssueCommentPanel
          id="dayend-comment"
          className="mt-3 sm:mt-6"
          issues={issues}
          title="Differences to explain"
          label="Comment"
          value={comment}
          disabled={approvals.dayend || role === 'administrator'}
          onChange={setComment}
        />

        {(role === 'manager' || role === 'administrator') ? (
          <div className="print-only dayend-print-sheet">
            <PrintSheet data={printData} />
          </div>
        ) : null}
      </FormTopBar>
    </div>
  )
}

function PrintSheet({ data }) {
  const {
    storeName,
    period,
    approved,
    sales,
    card,
    voucher,
    cashHand,
    cashBF,
    paid,
    cashIn,
    cashOut,
    services,
    partA,
    expected,
    difference,
    cashInTotal,
    cashOutTotal,
    cashCF,
  } = data

  return (
    <div className="dayend-print-inner">
      <header className="dayend-print-header">
        <p className="print-brand">Premier Woodgreen | Store Operations</p>
        <h1>Day-end report</h1>
        <p>
          {storeName} · {period} · Final shift
        </p>
        <div className="dayend-print-meta">
          <span>
            <strong>Approval:</strong> {approved ? 'Approved & locked' : 'Pending'}
          </span>
          <span>
            <strong>Cash C/F:</strong> {money(cashCF)}
          </span>
        </div>
      </header>

      <section className="dayend-print-section">
        <h2>Sales reconciliation</h2>
        <div className="dayend-print-row dayend-print-row-strong">
          <span>Sales</span>
          <strong>{money(sales)}</strong>
        </div>

        <div className="dayend-print-subhead">
          <span>Part A · Deductions</span>
          <strong>{money(partA)}</strong>
        </div>
        {paid.map((item, i) => (
          <div key={`paid-${i}`} className="dayend-print-row">
            <span>{item.description}</span>
            <span>{money(item.amount)}</span>
          </div>
        ))}

        <div className="dayend-print-subhead">
          <span>Part B · Payments</span>
          <strong>{money(Number(card) + Number(voucher))}</strong>
        </div>
        <div className="dayend-print-payments">
          <div>
            <em>Card</em>
            <strong>{money(card)}</strong>
          </div>
          <div>
            <em>Voucher</em>
            <strong>{money(voucher)}</strong>
          </div>
        </div>

        <div className="dayend-print-calcs">
          <div>
            <em>Expected cash</em>
            <strong>{money(expected)}</strong>
          </div>
          <div>
            <em>Physical cash in hand</em>
            <strong>{money(cashHand)}</strong>
          </div>
          <div className={difference >= 0 ? 'ok' : 'short'}>
            <em>Cash {difference >= 0 ? 'over' : 'short'}</em>
            <strong>
              {difference >= 0 ? '+' : '−'}
              {money(Math.abs(difference))}
            </strong>
          </div>
        </div>
      </section>

      <section className="dayend-print-section">
        <h2>Service reconciliation</h2>
        <table>
          <thead>
            <tr>
              <th className="svc">Service</th>
              <th>Actual</th>
              <th>Till reading</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(services).map(([name, vals]) => {
              const diff = vals[1] - vals[0]
              return (
                <tr key={name}>
                  <td className="svc">
                    {name}
                    {name === 'Scratch Card' ? <small> (from sales)</small> : null}
                  </td>
                  <td>{money(vals[0])}</td>
                  <td>{money(vals[1])}</td>
                  <td>
                    {diff >= 0 ? '+' : '−'}
                    {money(Math.abs(diff))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="dayend-print-section">
        <h2>
          Running cash balance <em>Cash C/F {money(cashCF)}</em>
        </h2>

        <div className="dayend-print-cash-cols">
          <div>
            <div className="dayend-print-subhead">
              <span>Cash in</span>
              <strong>{money(cashInTotal)}</strong>
            </div>
            {cashIn.map((item, i) => (
              <div key={`in-${i}`} className="dayend-print-row">
                <span>{item.description}</span>
                <span>{money(item.amount)}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="dayend-print-subhead">
              <span>Cash outgoing</span>
              <strong>{money(cashOutTotal)}</strong>
            </div>
            {cashOut.map((item, i) => (
              <div key={`out-${i}`} className="dayend-print-row">
                <span>{item.description}</span>
                <span>{money(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dayend-print-cash-strip">
          <div>
            <em>Cash B/F</em>
            <strong>{money(cashBF)}</strong>
          </div>
          <span>+</span>
          <div>
            <em>Cash in hand</em>
            <strong>{money(cashHand)}</strong>
          </div>
          <span>+</span>
          <div>
            <em>Cash in</em>
            <strong>{money(cashInTotal)}</strong>
          </div>
          <span>−</span>
          <div>
            <em>Cash outgoing</em>
            <strong>{money(cashOutTotal)}</strong>
          </div>
          <span>→</span>
          <div className="cf">
            <em>Cash C/F</em>
            <strong>{money(cashCF)}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

function MoneyInput({ value, onChange, className, disabled = false }) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        £
      </span>
      <Input
        type="number"
        step="0.01"
        inputMode="decimal"
        className="h-9 pl-6 sm:h-9"
        value={value}
        disabled={disabled}
        readOnly={disabled}
        onChange={e => {
          if (disabled || !onChange) return
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }}
      />
    </div>
  )
}

function SectionHead({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 sm:pb-2">
      <span className="text-xs font-semibold text-gray-900 sm:text-sm">{label}</span>
      {value ? <strong className="text-xs text-gray-900 sm:text-sm">{value}</strong> : null}
    </div>
  )
}

function CalcBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 sm:px-3 sm:py-2">
      <p className="text-[10px] text-gray-500 sm:text-xs">{label}</p>
      <div className="mt-0.5 text-sm font-bold text-gray-900 sm:mt-1 sm:text-lg">{value}</div>
    </div>
  )
}

function CashPill({ label, value, highlight, className }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-1.5 sm:px-3 sm:py-2',
        highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white',
        className,
      )}
    >
      <p className="text-[10px] text-gray-500 sm:text-[11px]">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function LineItems({ items, setItems, editable }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-2">
          {editable ? (
            <>
              <Input
                className="min-w-0 flex-1"
                value={item.description}
                onChange={e =>
                  setItems(x => x.map((a, n) => (n === i ? { ...a, description: e.target.value } : a)))
                }
              />
              <MoneyInput
                className="w-24 shrink-0 sm:w-28"
                value={item.amount}
                onChange={amount =>
                  setItems(x => x.map((a, n) => (n === i ? { ...a, amount } : a)))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setItems(x => x.filter((_, n) => n !== i))}
              >
                <X size={16} />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-gray-700">{item.description}</span>
              <strong className="text-sm">{money(item.amount)}</strong>
            </>
          )}
        </div>
      ))}
      {editable ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItems(x => [...x, { description: 'New item', amount: 0 }])}
        >
          <Plus size={14} /> Add line
        </Button>
      ) : null}
    </div>
  )
}
