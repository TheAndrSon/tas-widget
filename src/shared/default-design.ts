/**
 * Сгенерировано tools/generate-default-design.mjs из рабочего state.json.
 * Это зафиксированное оформление виджетов по умолчанию: фоны, рамки, шрифты,
 * текстуры, эффекты и настройки отображения.
 */
import type { StylePreset, WidgetSettings, WidgetStyle, WidgetType } from './types'

/** Картинка, которую установщик кладёт в userData/images. */
export const DEFAULT_BACKGROUND_IMAGE_ID = 'img-mw8rt5d7-99623796'

/** Виджеты, которые временно отключены до доработки. */
export const DEFAULT_ENABLED = {
  weather: true,
  music: true,
  clock: false,
  weekday: false,
  calendar: true,
  astro: true,
  tarot: true,
  dice: true,
  equalizer: false,
  todo: true,
  sims: true,
  finance: true,
  twitch: false,
  system: true
} as Record<WidgetType, boolean>

export const DEFAULT_STYLES = {
  weather: {
    presetId: 'tribe-one',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.72,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'stars',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  music: {
    presetId: 'tribe-one',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.6,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 67.73399014778325,
        y: 55.91133004926108,
        zoom: 1.9
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'none',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  clock: {
    presetId: 'tribe-one',
    windowless: true,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 0,
      blur: 0,
      darken: 0,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: false,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Arial', sans-serif",
    fontScale: 1.5,
    font: {
      outline: {
        enabled: true,
        width: 0.5,
        color: '#000000',
        opacity: 0,
        mode: 'outside'
      },
      shadow: {
        enabled: true,
        color: '#000000',
        opacity: 0.45,
        blur: 1,
        offsetX: 2,
        offsetY: 2
      },
      contrastPrimary: true,
      contrastSecondary: true,
      pattern: 'none'
    },
    align: {
      primary: 'center',
      secondary: 'center'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'none',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  weekday: {
    presetId: 'tribe-one',
    windowless: true,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.72,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: false,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#ffffff',
    mutedColor: '#ffffff',
    accent: null,
    fontFamily: "'Arial', sans-serif",
    fontScale: 1.45,
    font: {
      outline: {
        enabled: true,
        width: 0.5,
        color: '#000000',
        opacity: 0,
        mode: 'outside'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: true,
      contrastSecondary: true,
      pattern: 'none'
    },
    align: {
      primary: 'center',
      secondary: 'center'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'none',
    ambient: {
      kind: 'none',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  calendar: {
    presetId: 'notebook-light',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'color',
      color: '#fff1cc',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: true,
      style: 'dashed',
      width: 1,
      color: '#000000',
      color2: '#62e6ff',
      opacity: 0.8,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#1e1810',
    mutedColor: '#751a1a',
    accent: '#fd3f52',
    fontFamily: "'Ink Free', 'Segoe Print', cursive",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'paper',
    ambient: {
      kind: 'none',
      intensity: 0.7,
      color: '#ff0059',
      shootingFrequency: 8
    }
  },
  astro: {
    presetId: 'tribe-one',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.72,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'stars',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  tarot: {
    presetId: 'tribe-one',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.72,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'stars',
      intensity: 0.75,
      color: '#471a7f',
      shootingFrequency: 5
    }
  },
  dice: {
    presetId: 'tribe-one',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'image',
      color: '#070609',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0.72,
      imageId: 'img-mw8rt5d7-99623796',
      crop: {
        x: 59.85221674876847,
        y: 54.26929392446634,
        zoom: 2.8
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 0,
      color: '#955dfe',
      color2: '#42ffd9',
      opacity: 0.7,
      glow: 0.2,
      glowSize: 8,
      animated: false
    },
    textColor: '#efe9dc',
    mutedColor: '#9a927f',
    accent: '#bc58fe',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'stars',
      intensity: 0.1,
      color: '#70ffe7',
      shootingFrequency: 9
    }
  },
  equalizer: {
    presetId: 'smoked',
    windowless: true,
    shape: 'squircle',
    radius: 22,
    corners: {
      tl: 22,
      tr: 22,
      br: 22,
      bl: 22
    },
    background: {
      kind: 'glass',
      color: '#0d0f15',
      color2: '#2a3040',
      angle: 155,
      opacity: 0,
      blur: 24,
      darken: 0.12,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: false,
      style: 'solid',
      width: 1,
      color: '#ffffff',
      color2: '#62e6ff',
      opacity: 0.12,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#f6f8ff',
    mutedColor: '#a9b1c7',
    accent: null,
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'noise',
    ambient: {
      kind: 'none',
      intensity: 0.6,
      color: '#ffffff',
      shootingFrequency: 8,
      dayNight: false,
      dayNightIntensity: 0.7
    }
  },
  todo: {
    presetId: 'notebook-light',
    windowless: false,
    shape: 'squircle',
    radius: 10,
    corners: {
      tl: 10,
      tr: 10,
      br: 10,
      bl: 10
    },
    background: {
      kind: 'color',
      color: '#fff1cc',
      color2: '#2a3040',
      angle: 155,
      opacity: 1,
      blur: 0,
      darken: 0,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: true,
      style: 'dashed',
      width: 1,
      color: '#000000',
      color2: '#62e6ff',
      opacity: 0.8,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#1e1810',
    mutedColor: '#751a1a',
    accent: '#fd3f52',
    fontFamily: "'Ink Free', 'Segoe Print', cursive",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'paper',
    ambient: {
      kind: 'none',
      intensity: 0.7,
      color: '#ff0059',
      shootingFrequency: 8
    }
  },
  sims: {
    presetId: 'tribe-one',
    windowless: true,
    shape: 'squircle',
    radius: 20,
    corners: {
      tl: 20,
      tr: 20,
      br: 20,
      bl: 20
    },
    background: {
      kind: 'glass',
      color: '#0d0f15',
      color2: '#2a3040',
      angle: 155,
      opacity: 0,
      blur: 0,
      darken: 0,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: false,
      style: 'solid',
      width: 1,
      color: '#ffffff',
      color2: '#62e6ff',
      opacity: 0.12,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#f6f8ff',
    mutedColor: '#a9b1c7',
    accent: null,
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'ring',
    texture: 'none',
    ambient: {
      kind: 'none',
      intensity: 0.6,
      color: '#ffffff',
      shootingFrequency: 8
    }
  },
  finance: {
    presetId: 'terminal',
    windowless: false,
    shape: 'squircle',
    radius: 4,
    corners: {
      tl: 4,
      tr: 4,
      br: 4,
      bl: 4
    },
    background: {
      kind: 'color',
      color: '#050807',
      color2: '#2a3040',
      angle: 155,
      opacity: 0.96,
      blur: 0,
      darken: 0,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: true,
      style: 'solid',
      width: 1,
      color: '#9dffb0',
      color2: '#62e6ff',
      opacity: 0.35,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#9dffb0',
    mutedColor: '#6aa979',
    accent: '#9dffb0',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'scanlines',
    ambient: {
      kind: 'none',
      intensity: 0.6,
      color: '#ffffff',
      shootingFrequency: 8
    }
  },
  twitch: {
    presetId: 'smoked',
    windowless: false,
    shape: 'squircle',
    radius: 22,
    corners: {
      tl: 22,
      tr: 22,
      br: 22,
      bl: 22
    },
    background: {
      kind: 'glass',
      color: '#0d0f15',
      color2: '#2a3040',
      angle: 155,
      opacity: 0.9,
      blur: 24,
      darken: 0.12,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: true,
      style: 'solid',
      width: 1,
      color: '#ffffff',
      color2: '#62e6ff',
      opacity: 0.12,
      glow: 0,
      glowSize: 8,
      animated: false
    },
    textColor: '#f6f8ff',
    mutedColor: '#a9b1c7',
    accent: null,
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'none',
    ambient: {
      kind: 'none',
      intensity: 0.6,
      color: '#ffffff',
      shootingFrequency: 8
    }
  },
  system: {
    presetId: 'terminal',
    windowless: false,
    shape: 'squircle',
    radius: 5,
    corners: {
      tl: 5,
      tr: 5,
      br: 5,
      bl: 5
    },
    background: {
      kind: 'color',
      color: '#050807',
      color2: '#2a3040',
      angle: 155,
      opacity: 0.96,
      blur: 0,
      darken: 0,
      imageId: null,
      crop: {
        x: 50,
        y: 50,
        zoom: 1
      }
    },
    border: {
      enabled: true,
      style: 'neon',
      width: 1,
      color: '#9dffb0',
      color2: '#62e6ff',
      opacity: 0.6,
      glow: 0.6,
      glowSize: 8,
      animated: false
    },
    textColor: '#9dffb0',
    mutedColor: '#6aa979',
    accent: '#9dffb0',
    fontFamily: "'Cascadia Mono', 'Consolas', monospace",
    fontScale: 1,
    font: {
      outline: {
        enabled: false,
        width: 1,
        color: '#000000',
        opacity: 0.65,
        mode: 'center'
      },
      shadow: {
        enabled: false,
        color: '#000000',
        opacity: 0.45,
        blur: 6,
        offsetX: 0,
        offsetY: 1
      },
      contrastPrimary: false,
      contrastSecondary: false,
      pattern: 'none'
    },
    align: {
      primary: 'left',
      secondary: 'left'
    },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'scanlines',
    ambient: {
      kind: 'stars',
      intensity: 0.25,
      color: '#00ffaa',
      shootingFrequency: 8
    }
  }
} as unknown as Record<WidgetType, WidgetStyle>

export const DEFAULT_SETTINGS = {
  weather: {
    city: {
      id: 524901,
      name: 'Москва',
      country: 'Россия',
      admin1: 'Москва',
      lat: 55.7558,
      lon: 37.6173,
      timezone: 'Europe/Moscow'
    },
    units: 'metric',
    provider: 'open-meteo',
    yandexKey: '',
    atmosphere: false,
    forecastDays: 3,
    showCity: true,
    showFeelsLike: true,
    showWind: true,
    showHumidity: true,
    sunMode: 'arc'
  },
  music: {
    showArt: false,
    showProgress: true,
    showControls: true,
    showSource: true,
    interactiveWhenLocked: true,
    visualizer: {
      mode: 'dots',
      palette: 'gradient',
      color1: '#9c00c7',
      color2: '#ce86fe',
      intensity: 0.5,
      bars: 72,
      maxHeight: 100,
      source: 'system',
      audioWindowIds: [],
      mirrorOrigin: 'start',
      freqMin: 4670,
      freqMax: 16100,
      freqScale: 'log',
      ringThickness: 3,
      ringPulse: 1,
      gradientAngle: 135,
      gradientScale: 1.9,
      gradientSpeed: 1.7
    }
  },
  clock: {
    format24: true,
    showSeconds: false,
    showCityTime: false,
    city: {
      id: 2643743,
      name: 'Лондон',
      country: 'Великобритания',
      lat: 51.5085,
      lon: -0.1257,
      timezone: 'Europe/London',
      admin1: 'Астраханская Область'
    },
    separator: 'dots'
  },
  weekday: {
    showWeekday: true,
    weekdayFormat: 'full',
    uppercase: true,
    language: 'ru',
    showSecondary: true,
    showDate: true,
    dateFormat: 'long',
    showWeekNumber: false
  },
  calendar: {
    view: 'month',
    layout: 'column',
    showHolidays: true,
    showWeekNumbers: false,
    holidayColor: '#eb0000',
    customDates: []
  },
  astro: {
    birthDate: '',
    sign: 'auto',
    view: 'sign',
    checkDay: 8,
    checkMonth: 11,
    showMoon: true,
    showPhrase: true,
    showElement: true,
    zodiacPackId: null
  },
  tarot: {
    spread: 3,
    reversed: true,
    showMeanings: true,
    interactiveWhenLocked: true,
    faceDown: true,
    deckId: null,
    back: null,
    tilt: true
  },
  dice: {
    die: 'coin',
    count: 1,
    crit: true,
    interactiveWhenLocked: true,
    showPips: true,
    showFaceText: true,
    showCoinLabel: false,
    hideOutline: false,
    diceSkin: null,
    coinHeads: null,
    coinTails: null,
    critText: 'Критический успех',
    failText: 'Критический провал'
  },
  equalizer: {
    visualizer: {
      mode: 'radial',
      palette: 'matrix',
      color1: '#7dff9e',
      color2: '#0f8f43',
      intensity: 0.8,
      bars: 64,
      maxHeight: 100,
      source: 'system',
      audioWindowIds: [],
      mirrorOrigin: 'start',
      freqMin: 30,
      freqMax: 16000,
      freqScale: 'log',
      ringThickness: 3,
      ringPulse: 1,
      gradientAngle: 135,
      gradientScale: 1,
      gradientSpeed: 1
    },
    showTrack: false,
    showLabel: false,
    interactiveWhenLocked: false,
    dock: 'free',
    dockThickness: 148,
    displayId: null,
    scale: 1,
    mirrorX: false,
    mirrorY: false
  },
  todo: {
    view: 'today',
    items: [],
    stickers: [],
    stickerSet: 'cute',
    showCompleted: true,
    interactiveWhenLocked: true
  },
  sims: {
    mode: 'plumbob',
    groupId: 'sim-1',
    label: 'The_Andr_S',
    difficulty: 'hard',
    showPoints: false,
    showDifficulty: false,
    showMoodValue: false,
    showArrow: false,
    plumbobVariant: 'classic',
    colorMode: 'mood',
    color: '#7ef29b',
    showLabel: true,
    animation: 'float',
    bling: true,
    blingIntensity: 1.5,
    interactiveWhenLocked: true
  },
  finance: {
    currencyCodes: ['USD', 'EUR', 'CNY'],
    showKeyRate: true,
    calculatorOpen: false,
    calculatorMode: 'credit',
    amount: 1000000,
    rate: 18,
    months: 60,
    downPayment: 0,
    paymentType: 'annuity',
    monthlyExtra: 0
  },
  twitch: {
    channels: [],
    clientId: '',
    clientSecret: '',
    showOffline: true
  },
  system: {
    orientation: 'horizontal',
    showCpu: true,
    showRam: true,
    showGpu: true,
    showNetwork: false,
    showDisks: false
  }
} as unknown as Record<WidgetType, WidgetSettings>

export const DEFAULT_PRESETS = [
  {
    id: 'tribe-one',
    name: 'Tribe One',
    builtin: true,
    style: {
      presetId: 'tribe-one',
      windowless: false,
      shape: 'squircle',
      radius: 10,
      corners: {
        tl: 10,
        tr: 10,
        br: 10,
        bl: 10
      },
      background: {
        kind: 'image',
        color: '#070609',
        color2: '#2a3040',
        angle: 155,
        opacity: 1,
        blur: 0,
        darken: 0.72,
        imageId: 'img-mw8rt5d7-99623796',
        crop: {
          x: 59.85221674876847,
          y: 54.26929392446634,
          zoom: 2.8
        }
      },
      border: {
        enabled: true,
        style: 'neon',
        width: 0,
        color: '#955dfe',
        color2: '#42ffd9',
        opacity: 0.7,
        glow: 0.2,
        glowSize: 8,
        animated: false
      },
      textColor: '#efe9dc',
      mutedColor: '#9a927f',
      accent: '#bc58fe',
      fontFamily: "'Cascadia Mono', 'Consolas', monospace",
      fontScale: 1,
      font: {
        outline: {
          enabled: false,
          width: 1,
          color: '#000000',
          opacity: 0.65,
          mode: 'center'
        },
        shadow: {
          enabled: false,
          color: '#000000',
          opacity: 0.45,
          blur: 6,
          offsetX: 0,
          offsetY: 1
        },
        contrastPrimary: false,
        contrastSecondary: false,
        pattern: 'none'
      },
      align: {
        primary: 'left',
        secondary: 'left'
      },
      underlay: null,
      overlay: null,
      frame: null,
      cursorEffect: 'none',
      texture: 'noise',
      ambient: {
        kind: 'stars',
        intensity: 0.1,
        color: '#70ffe7',
        shootingFrequency: 9
      }
    }
  },
  {
    id: 'notebook-light',
    name: 'Notebook Light',
    builtin: true,
    style: {
      presetId: 'notebook',
      windowless: false,
      shape: 'squircle',
      radius: 10,
      corners: {
        tl: 10,
        tr: 10,
        br: 10,
        bl: 10
      },
      background: {
        kind: 'color',
        color: '#fff1cc',
        color2: '#2a3040',
        angle: 155,
        opacity: 1,
        blur: 0,
        darken: 0,
        imageId: null,
        crop: {
          x: 50,
          y: 50,
          zoom: 1
        }
      },
      border: {
        enabled: true,
        style: 'dashed',
        width: 1,
        color: '#000000',
        color2: '#62e6ff',
        opacity: 0.8,
        glow: 0,
        glowSize: 8,
        animated: false
      },
      textColor: '#1e1810',
      mutedColor: '#751a1a',
      accent: '#fd3f52',
      fontFamily: "'Ink Free', 'Segoe Print', cursive",
      fontScale: 1,
      font: {
        outline: {
          enabled: false,
          width: 1,
          color: '#000000',
          opacity: 0.65,
          mode: 'center'
        },
        shadow: {
          enabled: false,
          color: '#000000',
          opacity: 0.45,
          blur: 6,
          offsetX: 0,
          offsetY: 1
        },
        contrastPrimary: false,
        contrastSecondary: false,
        pattern: 'none'
      },
      align: {
        primary: 'left',
        secondary: 'left'
      },
      underlay: null,
      overlay: null,
      frame: null,
      cursorEffect: 'none',
      texture: 'paper',
      ambient: {
        kind: 'none',
        intensity: 0.7,
        color: '#ff0059',
        shootingFrequency: 8
      }
    }
  }
] as StylePreset[]
