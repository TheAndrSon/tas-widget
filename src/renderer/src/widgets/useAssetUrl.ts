import { useEffect, useState } from 'react'

const cache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | null>>()

export function useAssetUrl(assetId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(assetId ? (cache.get(assetId) ?? null) : null)

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }
    if (cache.has(assetId)) {
      setUrl(cache.get(assetId) ?? null)
      return
    }

    let alive = true
    let request = pending.get(assetId)
    if (!request) {
      request = window.api.getImage(assetId)
      pending.set(assetId, request)
    }
    request
      .then(value => {
        cache.set(assetId, value)
        pending.delete(assetId)
        if (alive) setUrl(value)
      })
      .catch(() => {
        pending.delete(assetId)
        if (alive) setUrl(null)
      })

    return () => {
      alive = false
    }
  }, [assetId])

  return url
}
