import { useEffect, useState, type JSX } from 'react'
import type { TwitchResult, TwitchSettings } from '@shared/types'

export function TwitchWidget({ settings }: { settings: TwitchSettings }): JSX.Element {
  const [data, setData] = useState<TwitchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    const load = (): void => {
      setLoading(true)
      void window.widgets
        .getTwitch({
          channels: settings.channels,
          clientId: settings.clientId,
          clientSecret: settings.clientSecret
        })
        .then((result) => {
          if (alive) setData(result)
        })
        .finally(() => {
          if (alive) setLoading(false)
        })
    }
    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [settings.channels.join(','), settings.clientId, settings.clientSecret])

  if (!settings.clientId || !settings.clientSecret) {
    return (
      <div className="twitch">
        <div className="twitch__title">Twitch</div>
        <div className="twitch__hint">
          Добавьте Client ID и Client Secret в настройках виджета, чтобы видеть статус каналов.
        </div>
      </div>
    )
  }

  const channels = data?.ok ? data.channels : []
  return (
    <div className="twitch">
      <div className="twitch__head">
        <span className="twitch__title">Twitch</span>
        <span className={`twitch__status${loading ? ' is-loading' : ''}`}>
          {loading ? 'обновление' : data?.ok ? 'онлайн' : 'ошибка'}
        </span>
      </div>
      {channels.length === 0 && (
        <div className="twitch__hint">
          {data && !data.ok ? data.error : 'Добавьте каналы в настройках.'}
        </div>
      )}
      <div className="twitch__list">
        {channels
          .filter((channel) => settings.showOffline || channel.live)
          .map((channel) => (
            <button
              type="button"
              className={`twitch-channel${channel.live ? ' is-live' : ''} no-drag`}
              key={channel.login}
              onClick={() => window.widgets.openExternal(channel.url)}
              title={channel.title ?? channel.displayName}
            >
              <span className={`twitch-channel__dot${channel.live ? ' is-live' : ''}`} />
              <span className="twitch-channel__name">{channel.displayName}</span>
              <span className="twitch-channel__meta">
                {channel.live ? `${channel.viewers ?? 0} зр.` : 'offline'}
              </span>
            </button>
          ))}
      </div>
      {data?.ok && data.channels.some((channel) => channel.live) && (
        <div className="twitch__footer">
          {data.channels.find((channel) => channel.live)?.game ?? 'Трансляция'}
        </div>
      )}
    </div>
  )
}
