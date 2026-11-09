import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_BACKGROUND_IMAGE_ID } from '../shared/default-design'
import { resourcePath } from './paths'

/**
 * Копирует встроенные картинки оформления в userData при первом запуске.
 * Благодаря этому чистая установка получает тот же фон, что и рабочая копия.
 */
export function seedDefaultAssets(userDataDir: string): void {
  try {
    const imagesDir = join(userDataDir, 'images')
    mkdirSync(imagesDir, { recursive: true })
    const name = `${DEFAULT_BACKGROUND_IMAGE_ID}.jpg`
    const target = join(imagesDir, name)
    if (existsSync(target)) return
    const source = resourcePath('defaults', 'images', name)
    if (!existsSync(source)) return
    copyFileSync(source, target)
  } catch (error) {
    console.error('[defaults] не удалось скопировать встроенную картинку', error)
  }
}
