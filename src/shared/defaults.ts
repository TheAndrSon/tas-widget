import type {
  AppSettings,
  City,
  EqualizerSettings,
  WeatherSettings,
  WidgetId,
  WidgetPlacement
} from './types'
import { WIDGETS, readyWidgetIds } from './widgets'
import { DEFAULT_VISUALIZER } from './visualizer'
import { defaultWindowStyle } from './windowStyle'
import { createSimsState } from './sims'
import type { SimsMode, SimsSettings } from './types'

export const CITY_PRESETS: City[] = [
  {
    id: 524901,
    name: 'Москва',
    country: 'Россия',
    admin1: 'Москва',
    lat: 55.7558,
    lon: 37.6173,
    timezone: 'Europe/Moscow'
  },
  {
    id: 498817,
    name: 'Санкт-Петербург',
    country: 'Россия',
    admin1: 'Санкт-Петербург',
    lat: 59.9386,
    lon: 30.3141,
    timezone: 'Europe/Moscow'
  },
  {
    id: 1496747,
    name: 'Новосибирск',
    country: 'Россия',
    admin1: 'Новосибирская область',
    lat: 55.0415,
    lon: 82.9346,
    timezone: 'Asia/Novosibirsk'
  },
  {
    id: 511196,
    name: 'Пермь',
    country: 'Россия',
    admin1: 'Пермский край',
    lat: 58.0105,
    lon: 56.2502,
    timezone: 'Asia/Yekaterinburg'
  },
  {
    id: 1486209,
    name: 'Екатеринбург',
    country: 'Россия',
    admin1: 'Свердловская область',
    lat: 56.8575,
    lon: 60.6125,
    timezone: 'Asia/Yekaterinburg'
  },
  {
    id: 2643743,
    name: 'Лондон',
    country: 'Великобритания',
    lat: 51.5085,
    lon: -0.1257,
    timezone: 'Europe/London'
  },
  {
    id: 5128581,
    name: 'Нью-Йорк',
    country: 'США',
    lat: 40.7143,
    lon: -74.006,
    timezone: 'America/New_York'
  },
  {
    id: 1850147,
    name: 'Токио',
    country: 'Япония',
    lat: 35.6895,
    lon: 139.6917,
    timezone: 'Asia/Tokyo'
  }
]

function placement(id: WidgetId): WidgetPlacement {
  return {
    x: null,
    y: null,
    enabled: WIDGETS[id].ready && id === 'system',
    locked: false,
    layer: 1,
    style: defaultWindowStyle()
  }
}

const widgets = Object.fromEntries(
  Object.keys(WIDGETS).map(id => [id, placement(id as WidgetId)])
) as Record<WidgetId, WidgetPlacement>

export const DEFAULT_WEATHER_CITY = CITY_PRESETS[0]
export const MAX_WEATHER_CITIES = 5
export const MAX_EQUALIZER_COPIES = 5
export const DEFAULT_EQUALIZER_WIDTH = 360
export const DEFAULT_EQUALIZER_HEIGHT = 200
export const MAX_SIMS_INSTANCES = 4

export function simsSize(mode: SimsMode): { width: number; height: number } {
  return mode === 'needs' ? { width: 320, height: 420 } : { width: 220, height: 260 }
}

export function defaultSimsSettings(): SimsSettings {
  return {
    difficulty: 'light',
    label: 'Пламбоб',
    showLabel: true,
    showPoints: true,
    showDifficulty: true,
    showMoodValue: true,
    showNeeds: { hunger: true, social: true, hygiene: true, energy: true, fun: true },
    animation: 'float',
    bling: false,
    blingIntensity: 0.7
  }
}

export function defaultEqualizerSettings(): EqualizerSettings {
  return {
    visualizer: structuredClone(DEFAULT_VISUALIZER),
    windowed: true,
    stretch: false,
    displayId: null
  }
}

export const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
  units: 'metric',
  provider: 'open-meteo',
  yandexKey: '',
  atmosphere: false,
  atmosphereIntensity: { dawn: 1, day: 1, dusk: 1, night: 1 },
  forecastDays: 3,
  showCity: true,
  showFeelsLike: true,
  showWind: true,
  showHumidity: true,
  sunMode: 'arc'
}

export function defaultWeatherSettings(): WeatherSettings {
  return structuredClone(DEFAULT_WEATHER_SETTINGS)
}

export const DEFAULT_SETTINGS: AppSettings = {
  widgets,
  system: { intervalMs: 2000 },
  music: {
    showArt: true,
    showProgress: true,
    showControls: true,
    showSource: true,
    visualizer: {
      ...structuredClone(DEFAULT_VISUALIZER),
      mode: 'dots',
      intensity: 0.45,
      bars: 48,
      maxHeight: 60
    }
  },
  weather: {
    instances: [
      {
        id: 'weather-1',
        city: structuredClone(DEFAULT_WEATHER_CITY),
        x: null,
        y: null,
        enabled: false,
        locked: false,
        layer: 1,
        style: defaultWindowStyle(),
        settings: defaultWeatherSettings()
      }
    ]
  },
  equalizer: {
    instances: [
      {
        id: 'equalizer-1',
        x: null,
        y: null,
        width: DEFAULT_EQUALIZER_WIDTH,
        height: DEFAULT_EQUALIZER_HEIGHT,
        enabled: false,
        locked: false,
        layer: 1,
        style: defaultWindowStyle(false),
        settings: defaultEqualizerSettings()
      }
    ]
  },
  sims: {
    groups: { default: createSimsState('default') },
    instances: [
      {
        id: 'sims-1',
        mode: 'plumbob',
        groupId: 'default',
        x: null,
        y: null,
        width: simsSize('plumbob').width,
        height: simsSize('plumbob').height,
        enabled: false,
        locked: false,
        layer: 1,
        style: defaultWindowStyle(),
        settings: defaultSimsSettings()
      }
    ]
  },
  customStyles: []
}

export function defaultPlacement(id: WidgetId): WidgetPlacement {
  return placement(id)
}

export function defaultEnabledIds(): WidgetId[] {
  return readyWidgetIds().filter(id => DEFAULT_SETTINGS.widgets[id].enabled)
}
