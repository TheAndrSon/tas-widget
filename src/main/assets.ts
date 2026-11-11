import { app, dialog, nativeImage } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { ImageAsset } from '../shared/types'

interface AssetRecord {
  id: string
  name: string
  file: string
  width: number
  height: number
  createdAt: number
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
}

export class AssetStore {
  private dir = ''
  private file = ''
  private records: AssetRecord[] = []
  private loaded = false

  private ensure(): void {
    if (this.loaded) return
    this.loaded = true
    this.dir = join(app.getPath('userData'), 'assets', 'images')
    this.file = join(app.getPath('userData'), 'assets', 'images.json')
    try {
      mkdirSync(this.dir, { recursive: true })
    } catch {
      // ignore
    }
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as AssetRecord[]
      if (Array.isArray(parsed)) {
        this.records = parsed.filter(
          item => item && typeof item.id === 'string' && existsSync(join(this.dir, item.file))
        )
      }
    } catch {
      this.records = []
    }
  }

  private save(): void {
    try {
      mkdirSync(join(app.getPath('userData'), 'assets'), { recursive: true })
      writeFileSync(this.file, JSON.stringify(this.records, null, 2), 'utf8')
    } catch {
      // ignore
    }
  }

  private toAsset(record: AssetRecord): ImageAsset {
    const thumb = this.thumb(record)
    return {
      id: record.id,
      name: record.name,
      width: record.width,
      height: record.height,
      createdAt: record.createdAt,
      thumb
    }
  }

  private thumb(record: AssetRecord): string | undefined {
    try {
      const image = nativeImage.createFromPath(join(this.dir, record.file))
      if (image.isEmpty()) return undefined
      const size = image.getSize()
      const scale = Math.min(1, 96 / Math.max(1, size.width, size.height))
      return image
        .resize({
          width: Math.max(1, Math.round(size.width * scale)),
          height: Math.max(1, Math.round(size.height * scale))
        })
        .toDataURL()
    } catch {
      return undefined
    }
  }

  list(): ImageAsset[] {
    this.ensure()
    return this.records.map(record => this.toAsset(record))
  }

  async add(): Promise<ImageAsset | null> {
    this.ensure()
    const result = await dialog.showOpenDialog({
      title: 'Добавить картинку',
      properties: ['openFile'],
      filters: [{ name: 'Изображения', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
    })
    const path = result.canceled ? null : result.filePaths[0]
    if (!path) return null

    const ext = extname(path).toLowerCase()
    if (!MIME[ext]) return null
    const image = nativeImage.createFromPath(path)
    if (image.isEmpty()) return null
    const size = image.getSize()

    const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const file = `${id}${ext}`
    try {
      copyFileSync(path, join(this.dir, file))
    } catch {
      return null
    }

    const record: AssetRecord = {
      id,
      name: path.split(/[\\/]/).pop() ?? 'Картинка',
      file,
      width: size.width,
      height: size.height,
      createdAt: Date.now()
    }
    this.records.push(record)
    this.save()
    return this.toAsset(record)
  }

  dataUrl(id: string): string | null {
    this.ensure()
    const record = this.records.find(item => item.id === id)
    if (!record) return null
    try {
      const ext = extname(record.file).toLowerCase()
      const mime = MIME[ext] ?? 'image/png'
      return `data:${mime};base64,${readFileSync(join(this.dir, record.file)).toString('base64')}`
    } catch {
      return null
    }
  }

  remove(id: string): boolean {
    this.ensure()
    const record = this.records.find(item => item.id === id)
    if (!record) return false
    try {
      rmSync(join(this.dir, record.file), { force: true })
    } catch {
      // ignore
    }
    this.records = this.records.filter(item => item.id !== id)
    this.save()
    return true
  }
}
