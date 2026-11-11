import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  clampInstance,
  cloneWidgetSettings,
  createDefaultGeneral,
  createDefaultSettings,
  createDefaultState,
  createWidgetInstance,
  DEFAULT_SIMS_MOOD,
  normalizeSettings,
  STATE_VERSION
} from '../shared/defaults'
import { DEFAULT_BACKGROUND_IMAGE_ID, DEFAULT_ENABLED } from '../shared/default-design'
import { deepMerge } from '../shared/merge'
import { decayMood, simsDo } from '../shared/sims'
import { normalizeSlot, normalizeStyle } from '../shared/presets'
import type {
  GeneralSettings,
  ImageAsset,
  PersistedState,
  SimsAction,
  SimsDifficulty,
  SimsMood,
  Size,
  StylePreset,
  TarotDeck,
  WidgetInstance,
  WidgetSettings,
  WidgetStyle,
  WidgetType,
  ZodiacPack
} from '../shared/types'
import { MAX_COPIES_PER_TYPE, WIDGET_TYPES } from '../shared/types'

interface LegacyState {
  version?: number
  widgets?: Record<string, Partial<WidgetInstance>>
  settings?: Record<string, Record<string, unknown>>
}

function clampMood(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export class Store {
  state: PersistedState
  readonly file: string
  private saveTimer: NodeJS.Timeout | null = null

  constructor(private readonly userDataDir: string) {
    this.file = join(userDataDir, 'state.json')
    this.state = this.load()
    this.ensureDefaultImage()
  }

  private load(): PersistedState {
    const defaults = createDefaultState()
    if (!existsSync(this.file)) return defaults
    try {
      const raw = JSON.parse(readFileSync(this.file, 'utf8')) as unknown as LegacyState & {
        general?: Partial<GeneralSettings>
        customPresets?: StylePreset[]
        images?: ImageAsset[]
        zodiacPacks?: ZodiacPack[]
        tarotDecks?: TarotDeck[]
        sims?: Record<string, SimsMood>
      }
      const state =
        Number(raw.version) >= 2 && Array.isArray((raw as unknown as PersistedState).widgets)
          ? this.loadV2(raw as unknown as PersistedState, defaults)
          : this.migrateV1(raw, defaults)
      this.ensureTypes(state)
      return state
    } catch (error) {
      console.error(
        '[store] не удалось прочитать состояние, использую значения по умолчанию',
        error
      )
      return defaults
    }
  }

  private loadV2(raw: PersistedState, defaults: PersistedState): PersistedState {
    const seen = new Set<string>()
    const widgets: WidgetInstance[] = []
    const migrateV6 = Number(raw.version) < 6
    const migrateV7 = Number(raw.version) < 7
    for (const entry of raw.widgets) {
      if (!entry || !WIDGET_TYPES.includes(entry.type)) continue
      // Часы и день недели переделаны заново: старые экземпляры удаляем,
      // ensureTypes создаст их с новыми настройками и размерами.
      if (migrateV6 && (entry.type === 'clock' || entry.type === 'weekday')) continue
      const id = typeof entry.id === 'string' && entry.id ? entry.id : `${entry.type}-1`
      if (seen.has(id)) continue
      seen.add(id)
      const merged = deepMerge(createDefaultSettings(entry.type), entry.settings ?? {})
      const settings = normalizeSettings(entry.type, merged)
      if (entry.type === 'weekday') {
        const legacy = (entry.settings ?? {}) as { short?: boolean; showDate?: boolean }
        const weekday = settings as {
          weekdayFormat?: 'full' | 'short'
          showDate?: boolean
        }
        if (typeof legacy.short === 'boolean') {
          weekday.weekdayFormat = legacy.short ? 'short' : 'full'
        }
        if (typeof legacy.showDate === 'boolean') weekday.showDate = legacy.showDate
      }
      const instance = createWidgetInstance(entry.type, id, settings)
      instance.style = normalizeStyle(entry.style, entry.type)
      if (Number(raw.version) < 5) {
        instance.layer = 'desktop'
      }
      if (Number(raw.version) < 4) {
        const interactive = instance.settings as { interactiveWhenLocked?: boolean }
        if (['tarot', 'dice', 'todo', 'sims'].includes(entry.type)) {
          interactive.interactiveWhenLocked = true
        }
      }
      widgets.push(
        clampInstance({
          ...instance,
          enabled:
            migrateV7 && ['clock', 'weekday', 'equalizer', 'twitch'].includes(entry.type)
              ? false
              : entry.enabled !== false,
          locked: Boolean(entry.locked),
          layer: entry.layer === 'desktop' ? 'desktop' : 'always',
          opacity: entry.opacity ?? 1,
          scale: migrateV6 ? 1 : (entry.scale ?? 1),
          position: entry.position ?? null,
          contentSize: migrateV6 ? null : (entry.contentSize ?? null),
          manualSize: migrateV6 ? null : (entry.manualSize ?? null),
          displayId: migrateV6 ? null : (entry.displayId ?? null)
        })
      )
    }
    return {
      version: STATE_VERSION,
      widgets: widgets.length > 0 ? widgets : defaults.widgets,
      general: deepMerge(createDefaultGeneral(), raw.general ?? {}),
      customPresets: this.normalizePresets(raw.customPresets),
      images: this.normalizeImages(raw.images),
      zodiacPacks: this.normalizeZodiacPacks(raw.zodiacPacks),
      tarotDecks: this.normalizeTarotDecks(raw.tarotDecks),
      sims: this.normalizeSims(raw.sims)
    }
  }

  private migrateV1(raw: LegacyState, defaults: PersistedState): PersistedState {
    const legacyWidgets = raw.widgets ?? {}
    const legacySettings = raw.settings ?? {}
    const widgets = WIDGET_TYPES.map((type) => {
      const legacy = legacyWidgets[type] ?? {}
      const merged = deepMerge(createDefaultSettings(type), legacySettings[type] ?? {})
      const settings = normalizeSettings(type, merged)
      return clampInstance({
        ...createWidgetInstance(type, `${type}-1`, settings as WidgetSettings),
        enabled: legacy.enabled !== false,
        locked: Boolean(legacy.locked),
        layer: legacy.layer === 'desktop' ? 'desktop' : 'always',
        opacity: legacy.opacity ?? 1,
        scale: legacy.scale ?? 1,
        position: legacy.position ?? null,
        contentSize: legacy.contentSize ?? null,
        manualSize: null
      })
    })
    return {
      version: STATE_VERSION,
      widgets,
      general: deepMerge(
        createDefaultGeneral(),
        (legacySettings.general as Partial<GeneralSettings>) ?? {}
      ),
      customPresets: [],
      images: [],
      zodiacPacks: [],
      tarotDecks: [],
      sims: {
        'sim-1': structuredClone(DEFAULT_SIMS_MOOD)
      }
    }
  }

  private normalizePresets(input: StylePreset[] | undefined): StylePreset[] {
    if (!Array.isArray(input)) return []
    return input
      .filter(
        (preset) => preset && typeof preset.id === 'string' && typeof preset.name === 'string'
      )
      .map((preset) => ({
        id: preset.id,
        name: preset.name.slice(0, 60),
        builtin: false,
        style: normalizeStyle(preset.style, 'weather')
      }))
  }

  private normalizeImages(input: ImageAsset[] | undefined): ImageAsset[] {
    if (!Array.isArray(input)) return []
    return input.filter(
      (image) =>
        image &&
        typeof image.id === 'string' &&
        typeof image.file === 'string' &&
        existsSync(image.file)
    )
  }

  private normalizeZodiacPacks(input: ZodiacPack[] | undefined): ZodiacPack[] {
    if (!Array.isArray(input)) return []
    return input
      .filter((pack) => pack && typeof pack.id === 'string' && typeof pack.name === 'string')
      .map((pack) => {
        const images: ZodiacPack['images'] = {}
        for (const [sign, slot] of Object.entries(pack.images ?? {})) {
          if (slot?.imageId) images[sign as keyof ZodiacPack['images']] = normalizeSlot(slot)
        }
        return {
          id: pack.id,
          name: pack.name.slice(0, 60),
          builtin: false,
          images
        }
      })
  }

  private normalizeTarotDecks(input: TarotDeck[] | undefined): TarotDeck[] {
    if (!Array.isArray(input)) return []
    return input
      .filter((deck) => deck && typeof deck.id === 'string' && typeof deck.name === 'string')
      .map((deck) => {
        const cards: TarotDeck['cards'] = {}
        for (const [cardId, slot] of Object.entries(deck.cards ?? {})) {
          if (slot?.imageId) cards[cardId] = normalizeSlot(slot)
        }
        const meanings: NonNullable<TarotDeck['meanings']> = {}
        for (const [cardId, meaning] of Object.entries(deck.meanings ?? {})) {
          if (!meaning || typeof meaning !== 'object') continue
          const entry: { name?: string; upright?: string; reversed?: string } = {}
          if (typeof meaning.name === 'string' && meaning.name.trim()) {
            entry.name = meaning.name.slice(0, 60)
          }
          if (typeof meaning.upright === 'string' && meaning.upright.trim()) {
            entry.upright = meaning.upright.slice(0, 220)
          }
          if (typeof meaning.reversed === 'string' && meaning.reversed.trim()) {
            entry.reversed = meaning.reversed.slice(0, 220)
          }
          if (Object.keys(entry).length > 0) meanings[cardId] = entry
        }
        return {
          id: deck.id,
          name: deck.name.slice(0, 60),
          builtin: false,
          cards,
          back: deck.back?.imageId ? normalizeSlot(deck.back) : null,
          meanings
        }
      })
  }

  private normalizeSims(input: Record<string, SimsMood> | undefined): Record<string, SimsMood> {
    const result: Record<string, SimsMood> = {}
    if (input && typeof input === 'object') {
      for (const [groupId, mood] of Object.entries(input)) {
        if (!mood || typeof mood !== 'object') continue
        result[groupId] = {
          mood: clampMood(Number(mood.mood ?? 70)),
          hunger: clampMood(Number(mood.hunger ?? 65)),
          energy: clampMood(Number(mood.energy ?? 65)),
          fun: clampMood(Number(mood.fun ?? 65)),
          social: clampMood(Number(mood.social ?? 65)),
          hygiene: clampMood(Number(mood.hygiene ?? 65)),
          points: Math.max(0, Math.round(Number(mood.points ?? 0))),
          updatedAt: Number(mood.updatedAt ?? Date.now()),
          stats: { ...DEFAULT_SIMS_MOOD.stats, ...(mood.stats ?? {}) },
          unlocked: Array.isArray(mood.unlocked)
            ? mood.unlocked.filter((id): id is string => typeof id === 'string')
            : []
        }
      }
    }
    if (!result['sim-1']) result['sim-1'] = structuredClone(DEFAULT_SIMS_MOOD)
    return result
  }

  /** Гарантирует, что каждый тип присутствует хотя бы одним экземпляром. */
  private ensureTypes(state: PersistedState): void {
    for (const type of WIDGET_TYPES) {
      if (!state.widgets.some((widget) => widget.type === type)) {
        state.widgets.push({
          ...createWidgetInstance(type, this.nextId(state, type)),
          enabled: DEFAULT_ENABLED[type]
        })
      }
    }
  }

  private nextId(state: PersistedState, type: WidgetType): string {
    let index = 1
    const ids = new Set(state.widgets.map((widget) => widget.id))
    while (ids.has(`${type}-${index}`)) index += 1
    return `${type}-${index}`
  }

  /**
   * Встроенная фоновая картинка кладётся установщиком в userData/images.
   * Добавляем её в библиотеку, чтобы оформление по умолчанию работало и после
   * чистой установки, и у пользователей со старым state.json.
   */
  private ensureDefaultImage(): void {
    const file = join(this.userDataDir, 'images', `${DEFAULT_BACKGROUND_IMAGE_ID}.jpg`)
    if (!existsSync(file)) return
    const existing = this.state.images.find((image) => image.id === DEFAULT_BACKGROUND_IMAGE_ID)
    if (existing) {
      if (existing.file !== file) existing.file = file
      return
    }
    this.state.images.push({
      id: DEFAULT_BACKGROUND_IMAGE_ID,
      name: 'TAS background.jpg',
      file,
      width: 1200,
      height: 1500
    })
    this.scheduleSave()
  }

  saveNow(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    try {
      mkdirSync(dirname(this.file), { recursive: true })
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf8')
      renameSync(tmp, this.file)
    } catch (error) {
      console.error('[store] не удалось сохранить состояние', error)
    }
  }

  scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.saveNow(), 250)
  }

  get(id: string): WidgetInstance | undefined {
    return this.state.widgets.find((widget) => widget.id === id)
  }

  countOfType(type: WidgetType): number {
    return this.state.widgets.filter((widget) => widget.type === type).length
  }

  add(type: WidgetType, sourceId?: string): WidgetInstance | null {
    if (this.countOfType(type) >= MAX_COPIES_PER_TYPE) return null
    const source = sourceId ? this.get(sourceId) : this.state.widgets.find((w) => w.type === type)
    const id = this.nextId(this.state, type)
    const settings = source ? cloneWidgetSettings(source.settings) : createDefaultSettings(type)
    const instance = createWidgetInstance(type, id, settings)
    if (source) instance.style = structuredClone(source.style)
    instance.enabled = true
    instance.locked = false
    this.state.widgets.push(instance)
    this.scheduleSave()
    return instance
  }

  addPreset(name: string, style: WidgetStyle): StylePreset {
    const preset: StylePreset = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim().slice(0, 60) || 'Мой пресет',
      builtin: false,
      style: normalizeStyle(style, 'weather')
    }
    this.state.customPresets.push(preset)
    this.scheduleSave()
    return preset
  }

  removePreset(id: string): boolean {
    const before = this.state.customPresets.length
    this.state.customPresets = this.state.customPresets.filter((preset) => preset.id !== id)
    this.scheduleSave()
    return this.state.customPresets.length !== before
  }

  addImage(asset: ImageAsset): ImageAsset {
    this.state.images.push(asset)
    this.scheduleSave()
    return asset
  }

  imageUsed(id: string): boolean {
    const underlay = (slot: { imageId?: string } | null | undefined): boolean =>
      Boolean(slot?.imageId === id)
    for (const widget of this.state.widgets) {
      if (
        widget.style.background.imageId === id ||
        underlay(widget.style.underlay) ||
        underlay(widget.style.overlay) ||
        underlay(widget.style.frame)
      ) {
        return true
      }
      const settings = widget.settings as {
        diceSkin?: { imageId?: string } | null
        coinHeads?: { imageId?: string } | null
        coinTails?: { imageId?: string } | null
        stickers?: Array<{ imageId?: string | null }>
      }
      if (
        settings.diceSkin?.imageId === id ||
        settings.coinHeads?.imageId === id ||
        settings.coinTails?.imageId === id ||
        settings.stickers?.some((sticker) => sticker.imageId === id)
      ) {
        return true
      }
    }
    for (const pack of this.state.zodiacPacks) {
      if (Object.values(pack.images).some((slot) => slot?.imageId === id)) return true
    }
    for (const deck of this.state.tarotDecks) {
      if (Object.values(deck.cards).some((slot) => slot?.imageId === id)) return true
    }
    return false
  }

  deleteImage(id: string): { ok: boolean; used?: boolean } {
    if (this.imageUsed(id)) return { ok: false, used: true }
    const before = this.state.images.length
    this.state.images = this.state.images.filter((image) => image.id !== id)
    this.scheduleSave()
    return { ok: this.state.images.length !== before }
  }

  saveZodiacPack(pack: ZodiacPack): ZodiacPack {
    const existing = this.state.zodiacPacks.find((item) => item.id === pack.id)
    if (existing) {
      Object.assign(existing, pack, { builtin: false })
    } else {
      this.state.zodiacPacks.push({ ...pack, builtin: false })
    }
    this.scheduleSave()
    return pack
  }

  deleteZodiacPack(id: string): boolean {
    const before = this.state.zodiacPacks.length
    this.state.zodiacPacks = this.state.zodiacPacks.filter((pack) => pack.id !== id)
    this.scheduleSave()
    return this.state.zodiacPacks.length !== before
  }

  saveTarotDeck(deck: TarotDeck): TarotDeck {
    const existing = this.state.tarotDecks.find((item) => item.id === deck.id)
    if (existing) {
      Object.assign(existing, deck, { builtin: false })
    } else {
      this.state.tarotDecks.push({ ...deck, builtin: false })
    }
    this.scheduleSave()
    return deck
  }

  deleteTarotDeck(id: string): boolean {
    const before = this.state.tarotDecks.length
    this.state.tarotDecks = this.state.tarotDecks.filter((deck) => deck.id !== id)
    this.scheduleSave()
    return this.state.tarotDecks.length !== before
  }

  simsAction(
    groupId: string,
    action: SimsAction,
    difficulty: SimsDifficulty = 'classic',
    need?: 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene'
  ): SimsMood {
    const current = this.state.sims[groupId] ?? structuredClone(DEFAULT_SIMS_MOOD)
    const next = simsDo(current, action, difficulty, need)
    this.state.sims[groupId] = next
    this.scheduleSave()
    return next
  }

  tickSims(): boolean {
    let changed = false
    for (const [groupId, mood] of Object.entries(this.state.sims)) {
      const hard = this.state.widgets.some(
        (widget) =>
          widget.type === 'sims' &&
          (widget.settings as { groupId?: string }).groupId === groupId &&
          (widget.settings as { difficulty?: string }).difficulty === 'hard'
      )
      const next = decayMood(mood, Date.now(), hard ? 'hard' : 'classic')
      if (next !== mood) {
        this.state.sims[groupId] = next
        changed = true
      }
    }
    if (changed) this.scheduleSave()
    return changed
  }

  remove(id: string): boolean {
    const instance = this.get(id)
    if (!instance) return false
    if (this.countOfType(instance.type) <= 1) return false
    this.state.widgets = this.state.widgets.filter((widget) => widget.id !== id)
    this.scheduleSave()
    return true
  }

  update(id: string, patch: Partial<WidgetInstance>): WidgetInstance | null {
    const instance = this.get(id)
    if (!instance) return null
    const { id: _ignoredId, type: _ignoredType, settings: _ignoredSettings, ...safe } = patch
    Object.assign(instance, safe)
    const clamped = clampInstance(instance)
    Object.assign(instance, clamped)
    this.scheduleSave()
    return instance
  }

  updateSettings(id: string, patch: Record<string, unknown>): WidgetInstance | null {
    const instance = this.get(id)
    if (!instance) return null
    instance.settings = normalizeSettings(
      instance.type,
      deepMerge(instance.settings, patch) as WidgetSettings
    )
    this.scheduleSave()
    return instance
  }

  updateGeneral(patch: Partial<GeneralSettings>): void {
    this.state.general = deepMerge(this.state.general, patch)
    this.scheduleSave()
  }

  move(id: string, x: number, y: number): void {
    const instance = this.get(id)
    if (!instance) return
    instance.position = { x: Math.round(x), y: Math.round(y) }
    this.scheduleSave()
  }

  setContentSize(id: string, width: number, height: number): void {
    const instance = this.get(id)
    if (!instance) return
    instance.contentSize = { width: Math.round(width), height: Math.round(height) }
    this.scheduleSave()
  }

  setManualSize(id: string, size: Size | null): void {
    const instance = this.get(id)
    if (!instance) return
    instance.manualSize = size
      ? {
          width: Math.max(80, Math.round(size.width)),
          height: Math.max(60, Math.round(size.height))
        }
      : null
    this.scheduleSave()
  }

  clearPositions(): void {
    for (const widget of this.state.widgets) widget.position = null
    this.scheduleSave()
  }

  setLayerAll(layer: 'always' | 'desktop'): void {
    for (const widget of this.state.widgets) widget.layer = layer
    this.scheduleSave()
  }

  setLockedAll(locked: boolean): void {
    for (const widget of this.state.widgets) widget.locked = locked
    this.scheduleSave()
  }

  setAllEnabled(enabled: boolean): void {
    for (const widget of this.state.widgets) widget.enabled = enabled
    this.scheduleSave()
  }
}
