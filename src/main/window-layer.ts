import { spawn, type ChildProcess } from 'node:child_process'
import type { BrowserWindow } from 'electron'
import { resourcePath } from './paths'

/**
 * Electron на Windows в связке с прозрачными frameless-окнами иногда не выставляет
 * WS_EX_TOPMOST. Дублируем слой нативно через SetWindowPos в отдельном PowerShell-процессе.
 */
export class NativeLayer {
  private proc: ChildProcess | null = null
  private stopped = true
  private restartTimer: NodeJS.Timeout | null = null
  private borderQueue = new Set<string>()
  private clickQueue: Array<{ handle: string; enabled: boolean }> = []

  start(): void {
    if (process.platform !== 'win32') return
    this.stopped = false
    this.launch()
  }

  private launch(): void {
    if (this.stopped) return
    try {
      this.proc = spawn(
        'powershell.exe',
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          resourcePath('window-layer.ps1')
        ],
        { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }
      )
      this.proc.stdout?.setEncoding('utf8')
      this.proc.stdout?.on('data', (chunk: string) => {
        const text = String(chunk).trim()
        if (text && text.includes('ok=False')) console.error('[window-layer]', text.slice(0, 300))
      })
      this.proc.stderr?.setEncoding('utf8')
      this.proc.stderr?.on('data', (chunk: string) => {
        const text = String(chunk).trim()
        if (text) console.error('[window-layer]', text.slice(0, 300))
      })
      this.proc.on('error', (error) => console.error('[window-layer] spawn', error.message))
      this.proc.on('exit', () => {
        this.proc = null
        if (this.stopped) return
        this.restartTimer = setTimeout(() => this.launch(), 5000)
      })
      this.flushBorders()
      this.flushClicks()
    } catch (error) {
      console.error('[window-layer] failed', error)
    }
  }

  setTopmost(win: BrowserWindow, always: boolean): void {
    if (process.platform !== 'win32' || win.isDestroyed()) return
    try {
      const buffer = win.getNativeWindowHandle()
      const handle =
        buffer.length >= 8 ? buffer.readBigUInt64LE(0).toString() : String(buffer.readUInt32LE(0))
      this.proc?.stdin?.write(`${JSON.stringify({ h: handle, always })}\n`)
    } catch (error) {
      console.error('[window-layer] handle', error)
    }
  }

  /**
   * Убирает нативную рамку DWM вокруг прозрачного окна. На Windows 11 у
   * click-through (WS_EX_LAYERED) окна появляется серая рамка по границам,
   * даже когда CSS-фон и обводка полностью прозрачны.
   */
  removeBorder(win: BrowserWindow): void {
    if (process.platform !== 'win32' || win.isDestroyed()) return
    try {
      const buffer = win.getNativeWindowHandle()
      const handle =
        buffer.length >= 8 ? buffer.readBigUInt64LE(0).toString() : String(buffer.readUInt32LE(0))
      this.borderQueue.add(handle)
      this.flushBorders()
    } catch (error) {
      console.error('[window-layer] border', error)
    }
  }

  private flushBorders(): void {
    const stdin = this.proc?.stdin
    if (!stdin) return
    for (const handle of [...this.borderQueue]) {
      stdin.write(`${JSON.stringify({ h: handle, border: false })}\n`)
      this.borderQueue.delete(handle)
    }
  }

  /**
   * Клики сквозь окно без WS_EX_LAYERED. Встроенный setIgnoreMouseEvents
   * включает layered-режим, из-за которого Windows 11 рисует серую рамку.
   */
  setClickThrough(win: BrowserWindow, enabled: boolean): void {
    if (process.platform !== 'win32' || win.isDestroyed()) return
    try {
      const buffer = win.getNativeWindowHandle()
      const handle =
        buffer.length >= 8 ? buffer.readBigUInt64LE(0).toString() : String(buffer.readUInt32LE(0))
      this.clickQueue.push({ handle, enabled })
      this.flushClicks()
    } catch (error) {
      console.error('[window-layer] click', error)
    }
  }

  private flushClicks(): void {
    const stdin = this.proc?.stdin
    if (!stdin) return
    for (const item of this.clickQueue.splice(0)) {
      stdin.write(`${JSON.stringify({ h: item.handle, click: item.enabled })}\n`)
    }
  }

  stop(): void {
    this.stopped = true
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.stdin?.end()
      } catch {
        /* ignore */
      }
      this.proc.kill()
      this.proc = null
    }
  }
}
