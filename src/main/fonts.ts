import { execFile } from 'node:child_process'

const FALLBACK = [
  'Segoe UI Variable Text',
  'Segoe UI',
  'Inter',
  'Georgia',
  'Palatino Linotype',
  'Times New Roman',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Cascadia Mono',
  'Consolas',
  'Courier New',
  'Old English Text MT',
  'Ink Free'
]

export class FontService {
  private cache: { at: number; fonts: string[] } | null = null

  async list(): Promise<string[]> {
    if (this.cache && Date.now() - this.cache.at < 6 * 3600_000) return this.cache.fonts
    const script =
      'Add-Type -AssemblyName System.Drawing; ' +
      '[System.Drawing.Text.InstalledFontCollection]::new().Families | ForEach-Object { $_.Name }'
    const fonts = await new Promise<string[]>((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { timeout: 12000, windowsHide: true },
        (error, stdout) => {
          if (error) {
            resolve([])
            return
          }
          const names = stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
          resolve([...new Set(names)])
        }
      )
    })
    const result = fonts.length > 0 ? fonts : FALLBACK
    result.sort((a, b) => a.localeCompare(b, 'ru'))
    this.cache = { at: Date.now(), fonts: result }
    return result
  }
}
