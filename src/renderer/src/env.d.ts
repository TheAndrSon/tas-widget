import type { WidgetApi } from '../../preload/index'

declare global {
  interface Window {
    api: WidgetApi
  }
}

export {}
