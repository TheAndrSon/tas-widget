import type { ComponentType } from 'react'
import type { WidgetType } from '@shared/types'
import {
  IconCalendar,
  IconCard,
  IconClock,
  IconCloudSun,
  IconDie,
  IconEqualizer,
  IconFinance,
  IconNote,
  IconSims,
  IconStar,
  IconSystem,
  IconTodo,
  IconTwitch,
  IconWeekday
} from './ui/icons'

export const ACCENT: Record<WidgetType, string> = {
  weather: '#7cc4ff',
  music: '#a8e6c1',
  clock: '#e9ecff',
  weekday: '#c2b6ff',
  calendar: '#ffc48c',
  astro: '#d9b8ff',
  tarot: '#ff8f8f',
  dice: '#ffd166',
  equalizer: '#62e6ff',
  todo: '#f2c48d',
  sims: '#7ef29b',
  finance: '#9be7b0',
  twitch: '#c2a3ff',
  system: '#8fd8ff'
}

export const WIDGET_ICON: Record<
  WidgetType,
  ComponentType<{ size?: number; className?: string }>
> = {
  weather: IconCloudSun,
  music: IconNote,
  clock: IconClock,
  weekday: IconWeekday,
  calendar: IconCalendar,
  astro: IconStar,
  tarot: IconCard,
  dice: IconDie,
  equalizer: IconEqualizer,
  todo: IconTodo,
  sims: IconSims,
  finance: IconFinance,
  twitch: IconTwitch,
  system: IconSystem
}
