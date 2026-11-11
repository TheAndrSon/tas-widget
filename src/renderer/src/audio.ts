let analyser: AnalyserNode | null = null
let audioContext: AudioContext | null = null
let data: Uint8Array | null = null
let starting: Promise<AnalyserNode | null> | null = null
let failed = false

/**
 * Системный loopback-захват. Windows/Chromium не отдают отдельную аудиодорожку
 * окна, поэтому для режимов «окно»/«несколько» используется тот же системный микс.
 */
export async function ensureAnalyser(): Promise<AnalyserNode | null> {
  if (analyser) {
    if (audioContext?.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch {
        /* ignore */
      }
    }
    return analyser
  }
  if (failed) return null
  if (starting) return starting
  starting = (async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      stream.getVideoTracks().forEach(track => track.stop())
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop())
        failed = true
        return null
      }
      const context = new AudioContext()
      await context.resume()
      const source = context.createMediaStreamSource(new MediaStream(audioTracks))
      const node = context.createAnalyser()
      node.fftSize = 512
      node.smoothingTimeConstant = 0.78
      source.connect(node)
      audioContext = context
      analyser = node
      data = new Uint8Array(node.frequencyBinCount)
      return node
    } catch (error) {
      console.warn('[audio] loopback недоступен', error)
      failed = true
      return null
    }
  })()
  return starting
}

export function readSpectrum(): Uint8Array | null {
  if (!analyser || !data) return null
  analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>)
  return data
}

export function spectrumValue(index: number, count: number): number {
  if (!data) return 0
  const usable = Math.floor(data.length * 0.72)
  const start = Math.floor((index / count) * usable)
  const end = Math.max(start + 1, Math.floor(((index + 1) / count) * usable))
  let sum = 0
  for (let i = start; i < end; i += 1) sum += data[i]
  return sum / (end - start) / 255
}

export function audioSampleRate(): number {
  return audioContext?.sampleRate ?? 48000
}

export function spectrumValueRange(
  index: number,
  count: number,
  minHz: number,
  maxHz: number,
  scale: 'log' | 'linear'
): number {
  if (!data) return 0
  const nyquist = audioSampleRate() / 2
  const bins = data.length
  const low = Math.max(20, Math.min(nyquist - 1, minHz))
  const high = Math.max(low + 1, Math.min(nyquist, maxHz))
  const freqAt = (value: number): number => {
    if (scale === 'linear') return low + (high - low) * value
    const lo = Math.log(low)
    const hi = Math.log(high)
    return Math.exp(lo + (hi - lo) * value)
  }
  const f0 = freqAt(index / count)
  const f1 = freqAt((index + 1) / count)
  const start = Math.max(0, Math.min(bins - 1, Math.floor((f0 / nyquist) * bins)))
  const end = Math.max(start + 1, Math.min(bins, Math.ceil((f1 / nyquist) * bins)))
  let sum = 0
  for (let i = start; i < end; i += 1) sum += data[i]
  return sum / (end - start) / 255
}

export function audioReady(): boolean {
  return Boolean(analyser)
}

export function resetAudio(): void {
  audioContext?.close().catch(() => undefined)
  analyser = null
  audioContext = null
  data = null
  starting = null
  failed = false
}
