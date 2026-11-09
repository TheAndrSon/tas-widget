import { useEffect, useMemo, useState, type JSX } from 'react'
import type { FinanceResult, FinanceSettings } from '@shared/types'
import { useAppState } from '../../hooks'

function fmt(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
}

function monthlyPayment(
  amount: number,
  annualRate: number,
  months: number,
  type: FinanceSettings['paymentType']
): { monthly: number; total: number; overpay: number } {
  const safeMonths = Math.max(1, Math.round(months))
  const rate = annualRate / 100 / 12
  if (type === 'differentiated') {
    const principal = amount / safeMonths
    let total = 0
    for (let month = 0; month < safeMonths; month += 1) {
      const rest = amount - principal * month
      total += principal + rest * rate
    }
    return { monthly: principal + amount * rate, total, overpay: total - amount }
  }
  const monthly =
    rate === 0 ? amount / safeMonths : (amount * rate) / (1 - Math.pow(1 + rate, -safeMonths))
  const total = monthly * safeMonths
  return { monthly, total, overpay: total - amount }
}

export function FinanceWidget({
  settings,
  instanceId
}: {
  settings: FinanceSettings
  instanceId: string
}): JSX.Element {
  const state = useAppState()
  const [data, setData] = useState<FinanceResult | null>(null)
  const [open, setOpen] = useState(settings.calculatorOpen)
  const [mode, setMode] = useState(settings.calculatorMode)

  useEffect(() => {
    let alive = true
    const load = (): void => {
      void window.widgets.getFinance(settings.currencyCodes).then((result) => {
        if (alive) setData(result)
      })
    }
    load()
    const timer = window.setInterval(load, 30 * 60 * 1000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [settings.currencyCodes.join(',')])

  useEffect(() => setOpen(settings.calculatorOpen), [settings.calculatorOpen])
  useEffect(() => setMode(settings.calculatorMode), [settings.calculatorMode])

  const amount = mode === 'mortgage' ? Math.max(0, settings.amount - settings.downPayment) : settings.amount
  const result = useMemo(
    () => monthlyPayment(amount, settings.rate, settings.months, settings.paymentType),
    [amount, settings.months, settings.paymentType, settings.rate]
  )
  const deposit = useMemo(() => {
    const monthlyRate = settings.rate / 100 / 12
    const total = settings.amount * Math.pow(1 + monthlyRate, Math.max(1, settings.months))
    return { total, income: total - settings.amount }
  }, [settings.amount, settings.months, settings.rate])

  const patch = (value: Partial<FinanceSettings>): void => {
    void window.widgets.updateWidgetSettings(instanceId, value)
  }

  return (
    <div className="finance">
      <div className="finance__head">
        <div>
          <div className="finance__title">Финансы</div>
          <div className="finance__sub">ЦБ РФ · {data?.ok && data.keyRateDate ? data.keyRateDate : 'данные'}</div>
        </div>
        {settings.showKeyRate && (
          <div className="finance__rate">
            <span>{data?.ok && data.keyRate != null ? data.keyRate.toFixed(2) : '—'}</span>
            <small>ключевая ставка</small>
          </div>
        )}
      </div>

      <div className="finance__currencies">
        {data?.ok ? (
          data.currencies.map((currency) => (
            <div className="finance-currency" key={currency.code}>
              <span className="finance-currency__code">{currency.code}</span>
              <span className="finance-currency__value">
                {currency.value.toFixed(2)}
                {currency.change !== 0 && (
                  <span className={currency.change > 0 ? 'up' : 'down'}>
                    {currency.change > 0 ? '▲' : '▼'} {Math.abs(currency.change).toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="finance__empty">{data && !data.ok ? data.error : 'Загружаем курсы…'}</div>
        )}
      </div>

      <button type="button" className="finance__calculate no-drag" onClick={() => { setOpen((value) => !value); patch({ calculatorOpen: !open }) }}>
        {open ? 'Скрыть калькулятор' : 'Рассчитать'}
      </button>

      {open && (
        <div className="finance-calc no-drag">
          <div className="finance-calc__modes">
            {(['credit', 'mortgage', 'deposit'] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={mode === item ? 'is-active' : ''}
                onClick={() => { setMode(item); patch({ calculatorMode: item }) }}
              >
                {item === 'credit' ? 'Кредит' : item === 'mortgage' ? 'Ипотека' : 'Вклад'}
              </button>
            ))}
          </div>
          <div className="finance-calc__grid">
            <label>
              Сумма
              <input type="number" value={settings.amount} onChange={(event) => patch({ amount: Number(event.target.value) })} />
            </label>
            <label>
              Ставка, %
              <input type="number" step="0.1" value={settings.rate} onChange={(event) => patch({ rate: Number(event.target.value) })} />
            </label>
            <label>
              Срок, мес.
              <input type="number" value={settings.months} onChange={(event) => patch({ months: Number(event.target.value) })} />
            </label>
            {mode === 'mortgage' && (
              <label>
                Первый взнос
                <input type="number" value={settings.downPayment} onChange={(event) => patch({ downPayment: Number(event.target.value) })} />
              </label>
            )}
          </div>
          {mode !== 'deposit' && (
            <div className="finance-calc__modes finance-calc__modes--small">
              <button type="button" className={settings.paymentType === 'annuity' ? 'is-active' : ''} onClick={() => patch({ paymentType: 'annuity' })}>Аннуитет</button>
              <button type="button" className={settings.paymentType === 'differentiated' ? 'is-active' : ''} onClick={() => patch({ paymentType: 'differentiated' })}>Дифференцированный</button>
            </div>
          )}
          <div className="finance-calc__result">
            {mode === 'deposit' ? (
              <>
                <span>Итог: <b>{fmt(deposit.total)} ₽</b></span>
                <span>Доход: <b>{fmt(deposit.income)} ₽</b></span>
              </>
            ) : (
              <>
                <span>Платёж: <b>{fmt(result.monthly)} ₽</b></span>
                <span>Всего: <b>{fmt(result.total)} ₽</b></span>
                <span>Переплата: <b>{fmt(result.overpay)} ₽</b></span>
              </>
            )}
          </div>
        </div>
      )}
      {!state && <div className="finance__empty">Загрузка…</div>}
    </div>
  )
}
