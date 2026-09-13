import { ContentItem } from './index'

export interface BundleNewsItem {
  id: string
  tag: string
  title: string
  summary: string
  imageUrl: string
  publishedAt: string
  views: number
  author?: string
  accentColor?: string
  _content?: ContentItem
}

export interface BundleCardData {
  id: string
  title: string
  sectionTitle: string
  categorySlug: string
  subCategorySlug?: string
  accentColor?: string
  items: BundleNewsItem[]
}

export interface ThematicSectionData {
  id: string
  title: string
  categorySlug: string
  accentColor?: string
  bundles: BundleCardData[]
}

export interface TrendingRankItem {
  rank: string // e.g. "01", "02"
  title: string
  tag: string
  summary: string
  id: string
  imageUrl?: string
  viewsCount: string
  accentColor: string
  _content?: ContentItem
}

const TAG_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'DIVIDEND ALERT': { en: 'Dividend Alert', hi: 'डिविडेंड अलर्ट' },
  'IPO WATCH': { en: 'IPO Watch', hi: 'आईपीओ वॉच' },
  'MARKET BUZZ': { en: 'Market Buzz', hi: 'मार्केट बज़' },
  'STOCK RADAR': { en: 'Stock Radar', hi: 'स्टॉक रडार' },
  'GOLD & SILVER': { en: 'Gold & Silver', hi: 'सोना और चांदी' },
  'COMMODITY UPDATE': { en: 'Commodity Update', hi: 'कमोडिटी अपडेट' },
  'PERSONAL FINANCE': { en: 'Personal Finance', hi: 'पर्सनल फाइनेंस' },
  'TAX SAVER': { en: 'Tax Saver', hi: 'टैक्स सेवर' },
  'VIRAL NOW': { en: 'Viral Now', hi: 'वायरल अभी' },
  'TRENDING REEL': { en: 'Trending Reel', hi: 'ट्रेंडिंग रील' },
  'TWITTER BUZZ': { en: 'Twitter Buzz', hi: 'ट्विटर बज़' },
  'AI BREAKTHROUGH': { en: 'AI Breakthrough', hi: 'एआई तकनीक' },
  'EV REVOLUTION': { en: 'EV Revolution', hi: 'ईवी क्रांति' },
  'SMARTPHONE LAUNCH': { en: 'Smartphone Launch', hi: 'नया स्मार्टफोन' },
  'STARTUP WATCH': { en: 'Startup Watch', hi: 'स्टार्टअप' },
  'POLICY UPDATE': { en: 'Policy Update', hi: 'सरकारी नीति' },
  'BREAKING NEWS': { en: 'Breaking News', hi: 'ताज़ा खबर' },
  'DEFENSE WATCH': { en: 'Defense Watch', hi: 'रक्षा समाचार' },
  'WEATHER ALERT': { en: 'Weather Alert', hi: 'मौसम अलर्ट' },
}

export function getLocalizedTag(tag: string, language: string = 'en'): string {
  const upper = (tag || '').trim().toUpperCase()
  const found = TAG_TRANSLATIONS[upper]
  if (found) {
    return language === 'hi' ? found.hi : found.en
  }
  return tag
}

export function isOrangeTag(tag: string): boolean {
  if (!tag) return false
  const t = tag.trim().toUpperCase()
  return (
    t.includes('BREAKING') ||
    t.includes('VIRAL') ||
    t.includes('TRENDING') ||
    t.includes('ब्रेकिंग') ||
    t.includes('वायरल') ||
    t.includes('ट्रेंडिंग')
  )
}

/**
 * Helper to convert BundleNewsItem or TrendingRankItem into a full ContentItem for NewsDetail navigation
 */
export function bundleItemToContentItem(
  b: BundleNewsItem | TrendingRankItem,
  categoryName = 'General'
): ContentItem {
  if (b._content) {
    return b._content
  }

  return {
    _id: `bundle-${b.id}`,
    title: b.title,
    slug: `slug-${b.id}`,
    summary: b.summary,
    content: `${b.summary}\n\nनई दिल्ली / मुंबई: आरम्भ न्यूज़ की विशेष ग्राउंड रिपोर्ट के अनुसार, इस पूरे घटनाक्रम पर बाज़ार और जानकारों की गहरी नज़र बनी हुई है। विशेषज्ञों का मानना है कि आने वाले कारोबारी सत्रों में इसका सीधा प्रभाव उपभोक्ताओं और निवेशकों पर देखने को मिलेगा।\n\nआधिकारिक सूत्रों ने पुष्टि की है कि संबंधित विभागों और नियामकों द्वारा आवश्यक दिशा-निर्देश समय रहते जारी कर दिए जाएंगे। अधिक विवरण के लिए बने रहें आरम्भ न्यूज़ के साथ।`,
    bodyBlocks: [
      { id: `${b.id}-b1`, type: 'TEXT', html: b.summary },
      {
        id: `${b.id}-b2`,
        type: 'IMAGE',
        url:
          ('imageUrl' in b && b.imageUrl) ||
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
      },
      { id: `${b.id}-b3`, type: 'HEADING', text: 'मुख्य बिंदु और विश्लेषण' },
      {
        id: `${b.id}-b4`,
        type: 'TEXT',
        html: 'विशेषज्ञों के अनुसार, यह फैसला व्यापक आर्थिक सुधारों और पारदर्शिता की दिशा में उठाया गया एक महत्वपूर्ण कदम है।',
      },
    ],
    contentType: 'ARTICLE',
    status: 'PUBLISHED',
    category: { _id: 'cat-gen', slug: 'general', name: { en: categoryName, hi: categoryName } },
    tags: [b.tag || 'News', categoryName],
    language: 'hi',
    featuredImage: {
      url:
        ('imageUrl' in b && b.imageUrl) ||
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
      caption: b.title,
      credit: 'Aarambh News Network',
    },
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metrics: {
      views: ('views' in b ? b.views : 15000) || 15000,
      likes: 450,
      shares: 120,
      comments: 45,
    },
    flags: { isFeatured: true, isBreaking: false },
  }
}
