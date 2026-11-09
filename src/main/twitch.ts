import { net } from 'electron'
import type { TwitchChannelInfo, TwitchResult } from '../shared/types'

interface TokenCache {
  key: string
  token: string
  at: number
}

interface StreamRow {
  user_login: string
  user_name: string
  title?: string
  game_name?: string
  viewer_count?: number
  started_at?: string
  thumbnail_url?: string
}

interface UserRow {
  login: string
  display_name: string
}

export class TwitchService {
  private token: TokenCache | null = null
  private cache: { key: string; at: number; result: TwitchResult } | null = null

  private async appToken(clientId: string, clientSecret: string): Promise<string | null> {
    const key = `${clientId}:${clientSecret}`
    if (this.token && this.token.key === key && Date.now() - this.token.at < 50 * 24 * 3600_000) {
      return this.token.token
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await net.fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
        { method: 'POST', signal: controller.signal }
      )
      if (!response.ok) return null
      const json = (await response.json()) as { access_token?: string }
      if (!json.access_token) return null
      this.token = { key, token: json.access_token, at: Date.now() }
      return json.access_token
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  async get(settings: {
    channels: string[]
    clientId: string
    clientSecret: string
  }): Promise<TwitchResult> {
    const channels = settings.channels
      .map((channel) => channel.trim().toLowerCase())
      .filter((channel, index, list) => channel.length > 1 && list.indexOf(channel) === index)
      .slice(0, 12)
    const configured = Boolean(settings.clientId && settings.clientSecret)
    if (channels.length === 0 || !configured) {
      return { ok: true, channels: [], configured, fetchedAt: Date.now() }
    }
    const key = `${settings.clientId}:${channels.join(',')}`
    if (this.cache && this.cache.key === key && Date.now() - this.cache.at < 30_000) {
      return this.cache.result
    }
    const token = await this.appToken(settings.clientId, settings.clientSecret)
    if (!token) {
      return { ok: false, configured, error: 'Twitch не принял Client ID/Secret' }
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const query = channels.map((channel) => `user_login=${encodeURIComponent(channel)}`).join('&')
      const [usersResponse, streamsResponse] = await Promise.all([
        net.fetch(`https://api.twitch.tv/helix/users?${query}`, {
          signal: controller.signal,
          headers: { 'Client-Id': settings.clientId, Authorization: `Bearer ${token}` }
        }),
        net.fetch(`https://api.twitch.tv/helix/streams?${query}`, {
          signal: controller.signal,
          headers: { 'Client-Id': settings.clientId, Authorization: `Bearer ${token}` }
        })
      ])
      if (!usersResponse.ok || !streamsResponse.ok) {
        return { ok: false, configured, error: 'Twitch API недоступен' }
      }
      const users = ((await usersResponse.json()) as { data?: UserRow[] }).data ?? []
      const streams = ((await streamsResponse.json()) as { data?: StreamRow[] }).data ?? []
      const streamByLogin = new Map(streams.map((stream) => [stream.user_login, stream]))
      const result: TwitchChannelInfo[] = channels.map((login) => {
        const user = users.find((item) => item.login.toLowerCase() === login)
        const stream = streamByLogin.get(login)
        return {
          login,
          displayName: user?.display_name ?? stream?.user_name ?? login,
          live: Boolean(stream),
          title: stream?.title,
          game: stream?.game_name,
          viewers: stream?.viewer_count,
          startedAt: stream?.started_at,
          thumbnail: stream?.thumbnail_url,
          url: `https://www.twitch.tv/${login}`
        }
      })
      const payload: TwitchResult = { ok: true, channels: result, configured, fetchedAt: Date.now() }
      this.cache = { key, at: Date.now(), result: payload }
      return payload
    } catch (error) {
      return {
        ok: false,
        configured,
        error: error instanceof Error ? error.message : String(error)
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
