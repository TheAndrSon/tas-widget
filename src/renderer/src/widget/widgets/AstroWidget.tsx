import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import type { AstroSettings, ZodiacSign } from '@shared/types'
import { ZODIAC, ZODIAC_ORDER, dailyAdvice, moonPhase, resolveSign, signFromDayMonth } from '@shared/astro'
import { useAppState, useNow } from '../../hooks'
import { cropImageStyle, imageUrl } from '../../style'

function SignIcon({
  slot,
  sign,
  size = 'large'
}: {
  slot: { imageId: string; crop: { x: number; y: number; zoom: number } } | null | undefined
  sign: ZodiacSign
  size?: 'large' | 'small'
}): JSX.Element {
  const info = ZODIAC[sign]
  if (slot?.imageId) {
    return (
      <span className={`astro__icon astro__icon--${size}`}>
        <img src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" draggable={false} />
      </span>
    )
  }
  return <span className={`astro__glyph astro__glyph--${size}`}>{info.glyph}</span>
}

function ViewBar({
  view,
  onChange
}: {
  view: AstroSettings['view']
  onChange: (view: AstroSettings['view']) => void
}): JSX.Element {
  return (
    <div className="astro-viewbar no-drag">
      <button
        type="button"
        className={view === 'sign' ? 'is-active' : ''}
        onClick={() => onChange('sign')}
      >
        Мой знак
      </button>
      <button
        type="button"
        className={view === 'check' ? 'is-active' : ''}
        onClick={() => onChange('check')}
      >
        По дате
      </button>
      <button
        type="button"
        className={view === 'all' ? 'is-active' : ''}
        onClick={() => onChange('all')}
      >
        Все знаки
      </button>
    </div>
  )
}

function SignDetail({
  sign,
  packSlot,
  showMoon,
  showElement,
  showPhrase,
  onPrev,
  onNext,
  onBack,
  now
}: {
  sign: ZodiacSign
  packSlot: { imageId: string; crop: { x: number; y: number; zoom: number } } | null | undefined
  showMoon: boolean
  showElement: boolean
  showPhrase: boolean
  onPrev: () => void
  onNext: () => void
  onBack: () => void
  now: Date
}): JSX.Element {
  const info = ZODIAC[sign]
  const moon = moonPhase(now)
  const moonStyle = {
    background: `linear-gradient(${moon.waxing ? 90 : 270}deg, #f4eeda ${moon.illumination * 100}%, rgba(255,255,255,0.12) ${moon.illumination * 100}%)`
  } as CSSProperties
  return (
    <div className="astro-detail">
      <div className="astro-detail__nav">
        <button
          type="button"
          className="astro-detail__arrow no-drag"
          onClick={onPrev}
          title="Предыдущий знак"
        >
          ‹
        </button>
        <button type="button" className="astro-detail__back no-drag" onClick={onBack}>
          ← Все знаки
        </button>
        <button
          type="button"
          className="astro-detail__arrow no-drag"
          onClick={onNext}
          title="Следующий знак"
        >
          ›
        </button>
      </div>
      <div className="astro__head">
        <SignIcon slot={packSlot} sign={sign} />
        <div className="astro__meta">
          <div className="astro__sign">{info.name}</div>
          <div className="astro__dates">{info.dates}</div>
        </div>
        {showMoon && (
          <div className="astro__moon">
            <span className="moon" style={moonStyle} />
            <span className="astro__moon-name">{moon.name}</span>
          </div>
        )}
      </div>
      {showElement && (
        <div className="astro__chips">
          <span className="astro__chip">{info.element}</span>
          <span className="astro__chip">{info.planet}</span>
          <span className="astro__chip">{info.short}</span>
        </div>
      )}
      {showPhrase && <div className="astro__phrase">«{dailyAdvice(sign, now)}»</div>}
    </div>
  )
}

export function AstroWidget({ settings, instanceId }: { settings: AstroSettings; instanceId?: string }): JSX.Element {
  const now = useNow(60_000)
  const state = useAppState()
  const { sign, source } = resolveSign(settings, now)
  const info = ZODIAC[sign]
  const moon = moonPhase(now)
  const advice = dailyAdvice(sign, now)
  const sourceLabel =
    source === 'birth' ? 'Ваш знак' : source === 'manual' ? 'Выбранный знак' : 'Знак дня'
  const moonStyle = {
    background: `linear-gradient(${moon.waxing ? 90 : 270}deg, #f4eeda ${moon.illumination * 100}%, rgba(255,255,255,0.12) ${moon.illumination * 100}%)`
  } as CSSProperties
  const pack = settings.zodiacPackId
    ? state?.zodiacPacks.find((item) => item.id === settings.zodiacPackId)
    : undefined
  const slotFor = (item: ZodiacSign) => pack?.images[item] ?? null
  const [focus, setFocus] = useState<ZodiacSign | null>(null)

  useEffect(() => {
    setFocus(null)
  }, [settings.view])

  const setView = (view: AstroSettings['view']): void => {
    if (!instanceId) return
    void window.widgets.updateWidgetSettings(instanceId, { view })
  }

  if (settings.view === 'all') {
    return (
      <div className="astro astro--all">
        <ViewBar view="all" onChange={setView} />
        {focus ? (
          <SignDetail
            sign={focus}
            packSlot={slotFor(focus)}
            showMoon={settings.showMoon}
            showElement={settings.showElement}
            showPhrase={settings.showPhrase}
            now={now}
            onBack={() => setFocus(null)}
            onPrev={() => {
              const index = ZODIAC_ORDER.indexOf(focus)
              setFocus(ZODIAC_ORDER[(index - 1 + ZODIAC_ORDER.length) % ZODIAC_ORDER.length])
            }}
            onNext={() => {
              const index = ZODIAC_ORDER.indexOf(focus)
              setFocus(ZODIAC_ORDER[(index + 1) % ZODIAC_ORDER.length])
            }}
          />
        ) : (
          <>
            <div className="astro__head">
              <div className="astro__meta">
                <div className="astro__sign">Все знаки</div>
                <div className="astro__dates">по датам рождения</div>
              </div>
              <span className="astro__source">{pack?.name ?? 'знаки по умолчанию'}</span>
            </div>
            <div className="astro-grid">
              {ZODIAC_ORDER.map((item) => {
                const entry = ZODIAC[item]
                return (
                  <button
                    type="button"
                    className={`astro-grid__item no-drag${item === sign ? ' is-active' : ''}`}
                    key={item}
                    onClick={() => setFocus(item)}
                  >
                    <SignIcon slot={slotFor(item)} sign={item} size="small" />
                    <div className="astro-grid__text">
                      <div className="astro-grid__name">{entry.name}</div>
                      <div className="astro-grid__dates">{entry.dates}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  const checkedSign = signFromDayMonth(settings.checkDay, settings.checkMonth)
  const checkedInfo = ZODIAC[checkedSign]

  if (settings.view === 'check') {
    return (
      <div className="astro">
        <ViewBar view="check" onChange={setView} />
        <div className="astro__head">
          <SignIcon slot={slotFor(checkedSign)} sign={checkedSign} />
          <div className="astro__meta">
            <div className="astro__source">Знак по дате</div>
            <div className="astro__sign">{checkedInfo.name}</div>
            <div className="astro__dates">{checkedInfo.dates}</div>
          </div>
          {settings.showMoon && (
            <div className="astro__moon">
              <span className="moon" style={moonStyle} />
              <span className="astro__moon-name">{moon.name}</span>
            </div>
          )}
        </div>
        <div className="astro__check">
          {String(settings.checkDay).padStart(2, '0')}.{String(settings.checkMonth).padStart(2, '0')} —{' '}
          <b>{checkedInfo.name}</b>
        </div>
        {settings.showElement && (
          <div className="astro__chips">
            <span className="astro__chip">{checkedInfo.element}</span>
            <span className="astro__chip">{checkedInfo.planet}</span>
            <span className="astro__chip">{checkedInfo.short}</span>
          </div>
        )}
        {settings.showPhrase && <div className="astro__phrase">«{dailyAdvice(checkedSign, now)}»</div>}
      </div>
    )
  }

  return (
    <div className="astro">
      <ViewBar view="sign" onChange={setView} />
      <div className="astro__head">
        <SignIcon slot={slotFor(sign)} sign={sign} />
        <div className="astro__meta">
          <div className="astro__sign">{info.name}</div>
          <div className="astro__dates">{info.dates}</div>
          <div className="astro__source">{sourceLabel}</div>
        </div>
        {settings.showMoon && (
          <div className="astro__moon">
            <span className="moon" style={moonStyle} />
            <span className="astro__moon-name">{moon.name}</span>
          </div>
        )}
      </div>

      {settings.showElement && (
        <div className="astro__chips">
          <span className="astro__chip">{info.element}</span>
          <span className="astro__chip">{info.planet}</span>
          <span className="astro__chip">{info.short}</span>
        </div>
      )}

      {settings.showPhrase && <div className="astro__phrase">«{advice}»</div>}
    </div>
  )
}
