import { app } from 'electron'
import { join } from 'node:path'

export function resourcePath(...parts: string[]): string {
  const base = app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources')
  return join(base, ...parts)
}
