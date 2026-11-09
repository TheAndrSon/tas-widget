import { useEffect, useRef, useState, type JSX } from 'react'
import type { DiceKind, DiceSettings, ImageSlot } from '@shared/types'
import { cropImageStyle, imageUrl } from '../../style'

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
}

function random(sides: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] % sides) + 1
}

function Skin({ slot }: { slot: ImageSlot | null }): JSX.Element | null {
  if (!slot?.imageId || !slot.enabled) return null
  return (
    <>
      <img className="die-skin" src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" />
      <span className="die-skin__darken" style={{ opacity: slot.darken }} />
    </>
  )
}

function DieFace({
  value,
  rolling,
  skin,
  showPips
}: {
  value: number
  rolling: boolean
  skin: ImageSlot | null
  showPips: boolean
}): JSX.Element {
  return (
    <div className={`die${rolling ? ' is-rolling' : ''}${skin?.imageId ? ' has-skin' : ''}`}>
      <Skin slot={skin} />
      {showPips &&
        Array.from({ length: 9 }, (_, index) => (
          <span key={index} className={`die__pip${PIPS[value]?.includes(index) ? ' is-on' : ''}`} />
        ))}
    </div>
  )
}

function D20Face({
  value,
  rolling,
  skin,
  showText
}: {
  value: number
  rolling: boolean
  skin: ImageSlot | null
  showText: boolean
}): JSX.Element {
  return (
    <div
      className={`d20${rolling ? ' is-rolling' : ''}${value === 20 ? ' is-crit' : ''}${value === 1 ? ' is-fail' : ''}${skin?.imageId ? ' has-skin' : ''}`}
    >
      <Skin slot={skin} />
      {showText && <span>{value}</span>}
    </div>
  )
}

function Coin({
  value,
  rolling,
  heads,
  tails,
  showSymbol,
  showLabel
}: {
  value: number
  rolling: boolean
  heads: ImageSlot | null
  tails: ImageSlot | null
  showSymbol: boolean
  showLabel: boolean
}): JSX.Element {
  const active = value === 1
  return (
    <div className={`coin${rolling ? ' is-shaking' : ''}`}>
      <div className="coin__face">
        <Skin slot={active ? heads : tails} />
        {showSymbol && <span className="coin__glyph">{active ? '★' : '◈'}</span>}
        {showLabel && <span className="coin__label">{active ? 'Орёл' : 'Решка'}</span>}
      </div>
    </div>
  )
}

export function DiceWidget({
  settings,
  interactive,
  instanceId
}: {
  settings: DiceSettings
  interactive: boolean
  instanceId: string
}): JSX.Element {
  const kind = settings.die
  const sides = kind === 'd20' ? 20 : 6
  const coin = kind === 'coin'
  const makeRoll = (sidesValue: number, count: number): number[] =>
    Array.from({ length: count }, () => random(sidesValue))
  const [results, setResults] = useState<Record<DiceKind, number[]>>(() => ({
    d6: makeRoll(6, settings.count),
    d20: makeRoll(20, settings.count),
    coin: makeRoll(2, 1)
  }))
  const [rolling, setRolling] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const targetCount = coin ? 1 : settings.count
    setResults((previous) => {
      const current = previous[kind] ?? []
      if (current.length === targetCount) return previous
      const fitted =
        current.length > targetCount
          ? current.slice(0, targetCount)
          : [...current, ...makeRoll(coin ? 2 : sides, targetCount - current.length)]
      return { ...previous, [kind]: fitted }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.die, settings.count])

  const values = results[kind] ?? []

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const roll = (): void => {
    if (rolling) return
    setRolling(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setResults((previous) => ({
        ...previous,
        [kind]: makeRoll(coin ? 2 : sides, coin ? 1 : settings.count)
      }))
      setRolling(false)
      timer.current = null
    }, coin ? 720 : 480)
  }

  const switchKind = (next: DiceKind): void => {
    if (!interactive) return
    void window.widgets.updateWidgetSettings(instanceId, { die: next })
  }

  const changeCount = (delta: number): void => {
    if (!interactive || coin) return
    const next = Math.min(3, Math.max(1, settings.count + delta))
    if (next === settings.count) return
    void window.widgets.updateWidgetSettings(instanceId, { count: next as 1 | 2 | 3 })
  }

  const crit = settings.crit && kind === 'd20' && values.some((value) => value === 20)
  const fail = settings.crit && kind === 'd20' && values.some((value) => value === 1)
  const total = values.reduce((sum, value) => sum + value, 0)
  const coinResult = values[0] === 1 ? 'Орёл' : 'Решка'

  return (
    <div className={`dice${coin ? ' dice--coin' : ''}${settings.hideOutline ? ' no-outline' : ''}`}>
      <div className="dice__head">
        <span className="dice__title">{coin ? 'Монета' : 'Кубик'}</span>
        <div className="dice__kinds no-drag">
          {(['d6', 'd20', 'coin'] as DiceKind[]).map((option) => (
            <button
              type="button"
              key={option}
              className={kind === option ? 'is-active' : ''}
              disabled={!interactive}
              onClick={() => switchKind(option)}
            >
              {option === 'coin' ? 'монета' : option}
            </button>
          ))}
        </div>
      </div>

      <div className={`dice__row${interactive ? ' is-clickable no-drag' : ''}`} onClick={interactive ? roll : undefined}>
        {coin ? (
          <Coin
            value={values[0] ?? 1}
            rolling={rolling}
            heads={settings.coinHeads}
            tails={settings.coinTails}
            showSymbol={settings.showFaceText}
            showLabel={settings.showCoinLabel}
          />
        ) : (
          values.map((value, index) =>
            kind === 'd20' ? (
              <D20Face
                key={index}
                value={value}
                rolling={rolling}
                skin={settings.diceSkin}
                showText={settings.showFaceText}
              />
            ) : (
              <DieFace
                key={index}
                value={value}
                rolling={rolling}
                skin={settings.diceSkin}
                showPips={settings.showPips}
              />
            )
          )
        )}
      </div>

      <div
        className={`dice__count no-drag${coin ? ' is-placeholder' : ''}`}
        aria-hidden={coin}
      >
        <button type="button" disabled={!interactive || coin || settings.count <= 1} onClick={() => changeCount(-1)}>
          −
        </button>
        <span>кубиков: {settings.count}</span>
        <button type="button" disabled={!interactive || coin || settings.count >= 3} onClick={() => changeCount(1)}>
          +
        </button>
      </div>

      <div className="dice__footer">
        {coin && <span className="dice__total">{rolling ? 'подбрасываем…' : coinResult}</span>}
        {!coin && settings.count > 1 && <span className="dice__total">сумма {total}</span>}
        {crit && <span className="dice__crit">{settings.critText || 'Критический успех'}</span>}
        {fail && <span className="dice__fail">{settings.failText || 'Критический провал'}</span>}
        {!crit && !fail && !coin && (
          <span className="dice__hint">{interactive ? 'нажмите на кубик' : 'разблокируйте для броска'}</span>
        )}
      </div>
    </div>
  )
}
