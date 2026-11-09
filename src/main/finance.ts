import { net } from 'electron'
import type { FinanceResult } from '../shared/types'

const DAILY_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'
const KEY_RATE_URL = 'https://www.cbr.ru/hd_base/KeyRate/'
const CACHE_TTL = 30 * 60 * 1000

interface Daily {
  Date?: string
  Valute?: Record<
    string,
    { Name?: string; Nominal?: number; Value?: number; Previous?: number }
  >
}

export class FinanceService {
  private cache: { at: number; date: string | null; keyRate: number | null; data: Daily } | null = null

  private async daily(): Promise<{ date: string | null; keyRate: number | null; data: Daily }> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL) return this.cache
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await net.fetch(DAILY_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'TASWidget/0.5', Accept: 'application/json' }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as Daily
      let keyRate: number | null = null
      try {
        const keyResponse = await net.fetch(KEY_RATE_URL, {
          signal: controller.signal,
          headers: { 'User-Agent': 'TASWidget/0.5', Accept: 'text/html' }
        })
        if (keyResponse.ok) {
          const html = await keyResponse.text()
          const match = html.match(/<td[^>]*>\s*(\d{1,2}[.,]\d{2})\s*<\/td>/)
          if (match) keyRate = Number(match[1].replace(',', '.'))
        }
      } catch {
        /* ставка не критична */
      }
      this.cache = { at: Date.now(), date: data.Date ?? null, keyRate, data }
      return this.cache
    } finally {
      clearTimeout(timer)
    }
  }

  async get(codes: string[]): Promise<FinanceResult> {
    try {
      const data = await this.daily()
      const requested = codes
        .map((code) => code.toUpperCase())
        .filter((code, index, list) => list.indexOf(code) === index)
        .slice(0, 3)
      const currencies = requested
        .map((code) => {
          const item = data.data.Valute?.[code]
          if (!item) return null
          const nominal = Number(item.Nominal ?? 1)
          const value = Number(item.Value ?? 0)
          const previous = Number(item.Previous ?? value)
          return {
            code,
            name: String(item.Name ?? code),
            nominal,
            value,
            previous,
            change: previous ? value - previous : 0
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
      return {
        ok: true,
        keyRate: data.keyRate,
        keyRateDate: data.date,
        currencies,
        fetchedAt: Date.now()
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
