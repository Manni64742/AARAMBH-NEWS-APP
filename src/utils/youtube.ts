const PATTERNS: { re: RegExp; id: (m: RegExpMatchArray) => string }[] = [
  { re: /(?:youtube\.com|www\.youtube\.com)\/watch\?.*v=([\w-]{6,})/, id: (m) => m[1] },
  { re: /youtu\.be\/([\w-]{6,})/, id: (m) => m[1] },
  { re: /youtube\.com\/embed\/([\w-]{6,})/, id: (m) => m[1] },
  { re: /youtube\.com\/live\/([\w-]{6,})/, id: (m) => m[1] },
  { re: /youtube\.com\/shorts\/([\w-]{6,})/, id: (m) => m[1] },
]

export function videoIdFromUrl(url?: string): string | null {
  if (!url) return null
  const clean = url.trim()
  for (const p of PATTERNS) {
    const m = clean.match(p.re)
    if (m) return p.id(m)
  }
  // If string is already a standalone YouTube video ID (typically 11 chars)
  if (/^[\w-]{11}$/.test(clean)) return clean
  if (/^[\w-]{6,15}$/.test(clean) && !clean.includes('.') && !clean.includes('/')) return clean
  return null
}

export function youtubeEmbedUrl(videoId: string, autoplay = true): string {
  const p = autoplay ? 'autoplay=1&' : ''
  return `https://www.youtube.com/embed/${videoId}?${p}enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=https://aarambhnews.com`
}

export function youtubeThumb(videoId?: string | null): string | null {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}