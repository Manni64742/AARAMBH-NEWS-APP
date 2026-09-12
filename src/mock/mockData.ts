import {
  ArticleBlock,
  CategoryItem,
  CommentItem,
  ContentItem,
  LiveStreamItem,
  ReporterPublicProfile,
} from '../types'

const now = Date.now()
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString()

export const mockImg = (seed: string, w = 800, h = 450) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

/* ────── Categories (master set, mirrors the backend seed) ────── */

export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    _id: 'cat-market',
    name: { en: 'Market', hi: 'मार्केट' },
    slug: 'market',
    level: 'TOP_LEVEL',
    displayOrder: 1,
    isActive: true,
    isFeatured: true,
    subCategories: [
      { _id: 'sub-stock-tips', name: { en: 'Stock Tips', hi: 'स्टॉक टिप्स' }, slug: 'stock-tips', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
      { _id: 'sub-ipo-markets', name: { en: 'IPO & Markets', hi: 'आईपीओ और बाज़ार' }, slug: 'ipo-markets', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
      { _id: 'sub-personal-finance', name: { en: 'Personal Finance', hi: 'व्यक्तिगत वित्त' }, slug: 'personal-finance', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
      { _id: 'sub-banking', name: { en: 'Banking', hi: 'बैंकिंग' }, slug: 'banking', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
      { _id: 'sub-insurance', name: { en: 'Insurance', hi: 'बीमा' }, slug: 'insurance', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
      { _id: 'sub-mutual-funds', name: { en: 'Mutual Funds', hi: 'म्यूचुअल फंड' }, slug: 'mutual-funds', level: 'SUB_CATEGORY', parentId: 'cat-market', isActive: true },
    ],
  },
  {
    _id: 'cat-social',
    name: { en: 'Social', hi: 'सामाजिक' },
    slug: 'social',
    level: 'TOP_LEVEL',
    displayOrder: 3,
    isActive: true,
    isFeatured: true,
    subCategories: [
      { _id: 'sub-state-politics', name: { en: 'State Politics', hi: 'राज्य राजनीति' }, slug: 'state-politics', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-national-politics', name: { en: 'National Politics', hi: 'राष्ट्रीय राजनीति' }, slug: 'national-politics', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-election', name: { en: 'Election', hi: 'चुनाव' }, slug: 'election', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-cricket', name: { en: 'Cricket', hi: 'क्रिकेट' }, slug: 'cricket', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-football', name: { en: 'Football', hi: 'फुटबॉल' }, slug: 'football', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-admissions', name: { en: 'Admissions', hi: 'प्रवेश' }, slug: 'admissions', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
      { _id: 'sub-exams', name: { en: 'Exams & Results', hi: 'परीक्षा और परिणाम' }, slug: 'exams', level: 'SUB_CATEGORY', parentId: 'cat-social', isActive: true },
    ],
  },
  {
    _id: 'cat-international',
    name: { en: 'International', hi: 'अंतर्राष्ट्रीय' },
    slug: 'international',
    level: 'TOP_LEVEL',
    displayOrder: 4,
    isActive: true,
    subCategories: [
      { _id: 'sub-world-news', name: { en: 'World News', hi: 'विश्व समाचार' }, slug: 'world-news', level: 'SUB_CATEGORY', parentId: 'cat-international', isActive: true },
      { _id: 'sub-science-space', name: { en: 'Science & Space', hi: 'विज्ञान और अंतरिक्ष' }, slug: 'science-space', level: 'SUB_CATEGORY', parentId: 'cat-international', isActive: true },
    ],
  },
  {
    _id: 'cat-auto',
    name: { en: 'Auto', hi: 'ऑटो' },
    slug: 'auto',
    level: 'TOP_LEVEL',
    displayOrder: 5,
    isActive: true,
    subCategories: [
      { _id: 'sub-cars', name: { en: 'Cars', hi: 'कारें' }, slug: 'cars', level: 'SUB_CATEGORY', parentId: 'cat-auto', isActive: true },
      { _id: 'sub-bikes', name: { en: 'Bikes', hi: 'बाइक' }, slug: 'bikes', level: 'SUB_CATEGORY', parentId: 'cat-auto', isActive: true },
      { _id: 'sub-ev', name: { en: 'Electric Vehicles', hi: 'इलेक्ट्रिक वाहन' }, slug: 'ev', level: 'SUB_CATEGORY', parentId: 'cat-auto', isActive: true },
    ],
  },
  { _id: 'cat-economic', name: { en: 'Economic', hi: 'आर्थिक' }, slug: 'economic', level: 'TOP_LEVEL', displayOrder: 6, isActive: true },
  { _id: 'cat-companies', name: { en: 'Companies', hi: 'कंपनियां' }, slug: 'companies', level: 'TOP_LEVEL', displayOrder: 7, isActive: true },
  { _id: 'cat-trending', name: { en: 'Trending', hi: 'ट्रेंडिंग' }, slug: 'trending', level: 'TOP_LEVEL', displayOrder: 8, isActive: true },
  { _id: 'cat-viral', name: { en: 'Viral', hi: 'वायरल' }, slug: 'viral', level: 'TOP_LEVEL', displayOrder: 9, isActive: true, isFeatured: true },
]

const cat = (id: string): CategoryItem => MOCK_CATEGORIES.find((c) => c._id === id) as CategoryItem
const subcat = (parentId: string, id: string): CategoryItem =>
  cat(parentId).subCategories?.find((s) => s._id === id) as CategoryItem

/* ────── Reporters ────── */

export const MOCK_REPORTERS: ReporterPublicProfile[] = [
  { reporterId: 'REP-UP-GKP-1001', name: 'Jai Prakash Singh', photo: mockImg('reporter-jai', 200, 200), designation: 'Senior Hyperlocal Reporter, Gorakhpur', badge: 'SENIOR_JOURNALIST' },
  { reporterId: 'REP-UP-LKO-1002', name: 'Anita Verma', photo: mockImg('reporter-anita', 200, 200), designation: 'Business & Markets Correspondent', badge: 'EXPERIENCED' },
  { reporterId: 'REP-UP-GKP-1003', name: 'Rohit Mishra', photo: mockImg('reporter-rohit', 200, 200), designation: 'Sports & Ground Reporter', badge: 'SENIOR_JOURNALIST' },
]

const author = (id: string) => {
  const r = MOCK_REPORTERS.find((x) => x.reporterId === id)
  return { _id: id, name: r?.name || 'Aarambh Bureau', avatar: r?.photo }
}

/* ────── Articles ────── */

interface Seed {
  title: string
  slug: string
  categoryId: string
  subCategoryId?: string
  summary: string
  paras: string[]
  tags: string[]
  state?: string
  district?: string
  city?: string
  locality?: string
  reporterId: string
  views: number
  likes: number
  shares: number
  comments: number
  pubHoursAgo: number
  imageSeed?: string
  imageUrl?: string
  breaking?: boolean
  featured?: boolean
  imageCaption?: string
}

function makeNews(s: Seed): ContentItem {
  const category = cat(s.categoryId)
  const imgUrl = s.imageUrl || mockImg(s.imageSeed || s.slug)
  const blocks: ArticleBlock[] = [
    { id: `${s.slug}-p1`, type: 'TEXT', html: s.paras[0] },
    { id: `${s.slug}-img`, type: 'IMAGE', url: imgUrl },
    { id: `${s.slug}-h2`, type: 'HEADING', text: s.tags[0]?.toUpperCase() || 'Read More' },
    ...s.paras.slice(1).map((p, i) => ({ id: `${s.slug}-p${i + 2}`, type: 'TEXT' as const, html: p })),
  ]
  const trends = Math.round((s.views + s.likes * 4 + s.shares * 6 + s.comments * 5) / 24)
  const imgCaption = s.imageCaption || `${s.title} · (फ़ोटो: Aarambh News Archive / PTI)`
  return {
    _id: `mock-${s.slug}`,
    title: s.title,
    slug: s.slug,
    summary: s.summary,
    content: s.paras.join('\n\n'),
    bodyBlocks: blocks,
    contentType: 'ARTICLE',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    author: author(s.reporterId),
    category,
    subCategory: s.subCategoryId ? subcat(s.categoryId, s.subCategoryId) : undefined,
    tags: s.tags,
    language: 'hi',
    location: {
      primary: { country: 'India', state: s.state, district: s.district, city: s.city, locality: s.locality },
      scope: s.city ? 'CITY' : s.district ? 'DISTRICT' : 'NATIONAL',
      additionalLocations: [],
    },
    featuredImage: { url: imgUrl, alt: s.title, credit: 'PTI / Aarambh News', caption: imgCaption },
    imageCaption: imgCaption,
    flags: { isBreaking: !!s.breaking, isFeatured: !!s.featured, isTrending: s.views > 9000 },
    metrics: {
      views: s.views,
      uniqueViewers: Math.round(s.views * 0.64),
      likes: s.likes,
      shares: s.shares,
      comments: s.comments,
      completionRate: 58,
      readingTimeSeconds: s.paras.join(' ').length / 14,
    },
    trendingScore: trends,
    publishedAt: hoursAgo(s.pubHoursAgo),
    createdAt: hoursAgo(s.pubHoursAgo + 2),
    updatedAt: hoursAgo(s.pubHoursAgo),
  } as ContentItem
}

function makeVideoNews(s: {
  title: string
  slug: string
  categoryId: string
  subCategoryId?: string
  summary: string
  paras: string[]
  tags: string[]
  reporterId: string
  state?: string
  district?: string
  city?: string
  views: number
  likes: number
  shares: number
  comments: number
  pubHoursAgo: number
  youtubeId: string
  duration: number
  imageUrl?: string
  thumbnailUrl?: string
  imageCaption?: string
}) {
  const base = makeNews({ ...s, imageSeed: s.slug })
  const ytUrl = `https://www.youtube.com/watch?v=${s.youtubeId}`
  const thumb = s.imageUrl || s.thumbnailUrl || `https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg`
  return {
    ...base,
    contentType: 'VIDEO' as const,
    youtubeUrl: ytUrl,
    youtubeId: s.youtubeId,
    videoPayload: {
      videoUrl: ytUrl,
      duration: s.duration,
      thumbnail: thumb,
    },
    featuredImage: {
      url: thumb,
      alt: s.title,
      credit: 'Aarambh News Desk',
      caption: s.imageCaption || `${s.title} · (ख़ास रिपोर्ट)`,
    },
    imageCaption: s.imageCaption || `${s.title} · (ख़ास रिपोर्ट)`,
    bodyBlocks: [
      { id: `${s.slug}-yt`, type: 'YOUTUBE' as const, embedUrl: ytUrl, title: s.title },
      ...((base.bodyBlocks ?? []) as ArticleBlock[]),
    ],
  } as ContentItem
}

const L = (state: string, district: string, city: string, locality?: string) => ({
  state,
  district,
  city,
  locality,
})

export const MOCK_NEWS: ContentItem[] = [
  makeNews({
    title: 'Cochin Shipyard shares plunge 9%: Rs 4,400 crore mcap lost! Why is defence stock falling? 5 key reasons',
    slug: 'cochin-shipyard-shares-plunge',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Shares of Cochin Shipyard Ltd fell nearly 9 per cent on Friday as investors booked profits after a massive multibagger rally in defence counters.',
    paras: [
      'Mumbai: Shares of Cochin Shipyard Ltd fell nearly 9 per cent on Friday after heavy institutional profit booking. The stock lost over Rs 4,400 crore in market capitalization during intraday trade as broad-based selling hit public-sector defence undertakings.',
      'Analysts point out that defence stocks have run up substantially over the past year and valuations in select names were pricing in flawless execution over the next five years. Any delay in order placement or margin contraction triggers sharp reactions.',
      'Market participants advise staggered accumulation at key technical support zones rather than aggressive bottom-fishing.',
    ],
    tags: ['Cochin Shipyard', 'Defence Stocks', 'Market', 'Finance', 'Share Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 28500, likes: 1620, shares: 980, comments: 240,
    pubHoursAgo: 1, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413604-stock-m-fall3.jpg',
    breaking: true, featured: true,
  }),
  makeNews({
    title: 'From Vodafone Idea to Coforge, Stocks in Focus on D-Street | Stock Market | BSE | NSE',
    slug: 'from-vodafone-idea-to-coforge-stocks-in-focus',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'We are approaching the end of yet another trading week, and Zee Business has brought together key stocks buzzing in today’s session.',
    paras: [
      'Mumbai: Dalal Street witnessed intense stock-specific action today with heavy volumes in telecom major Vodafone Idea, midcap IT favorite Coforge, and state-run energy companies.',
      'Institutional desks reported steady block deals and portfolio realignment ahead of next week’s derivatives expiry.',
      'Brokers noted that benchmark indices consolidated near psychological hurdles while broader market breadth stayed mixed.',
    ],
    tags: ['Vodafone Idea', 'Coforge', 'Stock Market', 'BSE', 'NSE', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 24100, likes: 1290, shares: 740, comments: 185,
    pubHoursAgo: 2, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413598-00000013.jpg',
    breaking: false, featured: true,
  }),
  makeNews({
    title: 'Ganesh Chaturthi 2026: Nifty gained in 5 of 7 years; Anil Singhvi picks THIS stock with Rs 600 target',
    slug: 'ganesh-chaturthi-nifty-picks-anil-singhvi',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Of the last seven Ganeshotsav periods, the Nifty gained in five years, while Zee Business Managing Editor Anil Singhvi picks top festive stocks.',
    paras: [
      'New Delhi: Historical market performance reveals strong festive seasonality for Indian benchmarks. Over the past seven Ganesh Chaturthi festive windows, benchmark Nifty 50 has delivered positive gains in five instances.',
      'Zee Business Managing Editor Anil Singhvi recommended a special "Vighnaharta" stock pick with a target price of Rs 600, highlighting robust business fundamentals and favorable risk-reward.',
      'Retail investors are advised to take advantage of market dips to build long-term quality portfolios in festive seasons.',
    ],
    tags: ['Anil Singhvi', 'Ganesh Chaturthi', 'Stock Pick', 'Nifty', 'Market', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 21900, likes: 1450, shares: 890, comments: 210,
    pubHoursAgo: 3, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413599-vighnaharta-stock-pick.jpg',
    breaking: true, featured: false,
  }),
  makeNews({
    title: 'Nifty Realty Plunges 4%: Rs 25,000 crore mcap wiped out! Why are Lodha, DLF, Godrej Properties falling?',
    slug: 'nifty-realty-plunges-4-percent',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Realty stocks came under heavy selling pressure on Friday, with the Nifty Realty index plunging more than 4 per cent.',
    paras: [
      'Mumbai: The Nifty Realty index plunged over 4 per cent as leading property developers including DLF, Macrotech Developers (Lodha) and Godrej Properties experienced sustained selling pressure.',
      'Concerns regarding quarterly pre-sales moderation and higher borrowing costs led foreign portfolio investors to pare exposure after the recent multifold run.',
      'Industry experts maintain that structural housing demand remains intact in tier-1 metros, although near-term stock price consolidation is healthy.',
    ],
    tags: ['Nifty Realty', 'Real Estate', 'DLF', 'Godrej Properties', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 18400, likes: 920, shares: 510, comments: 130,
    pubHoursAgo: 4, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413592-real-estate-stoks.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Nifty Bank Plunges Nearly 800 Points: Why are SBI, HDFC, Kotak Mahindra & bank stocks falling?',
    slug: 'nifty-bank-plunges-nearly-800-points',
    categoryId: 'cat-market',
    subCategoryId: 'sub-banking',
    summary: 'Banking and financial stocks came under pressure on Friday, with the Nifty Bank index falling nearly 800 points to 55,870.',
    paras: [
      'Mumbai: Banking heavyweights pulled the headline indices lower as net interest margin compression fears and slower deposit growth sparked risk-off sentiment across public and private lenders.',
      'HDFC Bank, ICICI Bank, State Bank of India and Kotak Mahindra Bank witnessed broad-based intraday offloading.',
      'Technical analysts suggest key banking index support at 55,500 levels, which will be crucial for near-term trend continuation.',
    ],
    tags: ['Nifty Bank', 'Banking', 'HDFC Bank', 'SBI', 'Kotak Mahindra', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 26300, likes: 1510, shares: 820, comments: 290,
    pubHoursAgo: 5, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413587-bank-stocks.jpg',
    breaking: true, featured: false,
  }),
  makeNews({
    title: 'Stock Market Today: Sensex slips below 74,500, Nifty down 1% as crude tops $109',
    slug: 'stock-market-today-sensex-slips-below-74500',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'The BSE Sensex dropped 679 points to trade at 74,223 while Nifty hovered near 23,300 amid surging international crude prices.',
    paras: [
      'Mumbai: Benchmark Indian equities slipped more than 1 per cent today as Brent crude crossed $109 a barrel on global geopolitical friction, reviving inflation worries and dampening rate-cut hopes.',
      'Foreign institutional investors offloaded equities worth over Rs 2,800 crore in the previous session, according to exchange data.',
      'Domestic institutional buyers stepped in with selective purchases in FMCG and pharmaceutical counters to hedge market volatility.',
    ],
    tags: ['Sensex', 'Nifty 50', 'Crude Oil', 'Stock Market', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 19800, likes: 1040, shares: 620, comments: 140,
    pubHoursAgo: 6, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413583-bear-market.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Anil Singhvi Nifty 50 Strategy: Strong support at 23,000-23,125 — Key levels to track on D-Street',
    slug: 'anil-singhvi-nifty-50-strategy',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Market guru Anil Singhvi suggests participants having long positions in the Nifty 50 place stop loss at key levels.',
    paras: [
      'New Delhi: Zee Business Managing Editor Anil Singhvi analyzed the intraday derivatives setup for traders, highlighting that 23,000 to 23,125 acts as an unyielding support cushion for the Nifty 50.',
      'On the higher side, resistance is expected near the 23,500 mark where heavy call writing has been observed.',
      'Traders are advised to follow strict stop-loss orders and avoid leveraged overnight positions until index clarity emerges.',
    ],
    tags: ['Anil Singhvi', 'Nifty Strategy', 'Trading Levels', 'Derivatives', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 17200, likes: 880, shares: 490, comments: 115,
    pubHoursAgo: 7, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413580-anil-singhvi-strategy-trading-tips.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Stocks in News: Raymond Realty, Granules India, Sterlite Tech in focus today',
    slug: 'stocks-in-news-raymond-granules-sterlite',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Indian equity markets see dynamic stock-specific action today driven by corporate filings, demerger milestones, and fresh export orders.',
    paras: [
      'Mumbai: Granules India reported US FDA inspection clearance with zero observations, triggering a 4 per cent surge in early trade.',
      'Raymond Realty gained after the management announced key project launches in the Mumbai Metropolitan Region.',
      'Sterlite Technologies bagged a multi-million-dollar optical fiber cable order from a prominent European telecom operator.',
    ],
    tags: ['Stocks in News', 'Raymond', 'Granules', 'Sterlite Tech', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 14500, likes: 730, shares: 380, comments: 90,
    pubHoursAgo: 8, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413594-00000041.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'What is causing crude oil to surge to levels last seen in mid-May? Key impact on Indian markets',
    slug: 'crude-oil-surge-mid-may-highs',
    categoryId: 'cat-market',
    subCategoryId: 'sub-personal-finance',
    summary: 'Global financial markets face fresh headwinds as Brent crude trades past $109 per barrel amid supply constraints.',
    paras: [
      'New Delhi: Elevated energy costs have historically pressured India’s fiscal deficit and trade balance. With crude climbing towards four-month highs, paint, tyre, and oil marketing companies experienced margin compression worries.',
      'Economists note that if crude sustains above $100 for an extended quarter, retail fuel prices and transport logistics could lift core CPI inflation.',
      'However, state-owned upstream exploration firms like ONGC and Oil India saw renewed investor interest on higher net realization prospects.',
    ],
    tags: ['Crude Oil', 'Commodities', 'Inflation', 'Energy', 'Economy', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 15300, likes: 790, shares: 410, comments: 95,
    pubHoursAgo: 9, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413586-crude-oil-news.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Stocks to Watch Today: Vodafone Idea, Neogen Chemicals, KIMS, Granules India',
    slug: 'stocks-to-watch-today-vodafone-kims-granules',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Granules India, Sterlite Technologies, Vodafone Idea, KIMS and Neogen Chemicals are among the key stocks in focus today.',
    paras: [
      'Mumbai: Institutional investors are tracking Neogen Chemicals following the commissioning of its battery materials facility in Gujarat.',
      'Healthcare provider KIMS announced brownfield hospital expansion plans in central India with an estimated capex of Rs 350 crore.',
      'Vodafone Idea saw active discussion around vendor debt clearance and ongoing discussions with telecom equipment makers.',
    ],
    tags: ['Stocks to Watch', 'Hot Stocks', 'Trading Ideas', 'D-Street', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 13900, likes: 670, shares: 340, comments: 80,
    pubHoursAgo: 10, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/11/413575-stocks-to-watch-2.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'EXCLUSIVE: SEBI Chairman TK Pandey says CAS consultation paper ‘just a few hours away’',
    slug: 'sebi-chairman-cas-consultation-paper',
    categoryId: 'cat-market',
    subCategoryId: 'sub-personal-finance',
    summary: 'The SEBI Chairman told Zee Business that the CAS mechanism will continue and the consultation paper is imminent.',
    paras: [
      'Mumbai: In an exclusive interview with Zee Business, SEBI Chairman TK Pandey confirmed that the consultation paper regarding Closing Auction Sessions (CAS) is ready and will be released for public comments shortly.',
      'The regulatory chief reiterated that modernizing price discovery during market closing hours remains a priority for ensuring market integrity.',
      'Market participants have welcomed the move, noting that closing auction systems help institutional traders execute large orders without undue price impact.',
    ],
    tags: ['SEBI', 'Regulatory', 'Capital Markets', 'Zee Business', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 16100, likes: 830, shares: 460, comments: 105,
    pubHoursAgo: 11, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/10/413574-sebi-chair-on-cas.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Redington stock at record high as Apple launches iPhone 18 Pro: Here is why',
    slug: 'redington-stock-record-high-apple-iphone-18',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'Apple has launched its latest Pro smartphones with major upgrades in camera, performance and AI capabilities, boosting distribution partners.',
    paras: [
      'Chennai: Shares of Redington India gained 6 per cent to hit an all-time high following the global launch of Apple’s latest smartphone lineup.',
      'Supply chain analysts indicate strong domestic pre-booking volumes across major retail electronics chains and quick commerce platforms.',
      'Redington’s enterprise technology distribution division also posted consistent double-digit revenue growth in the previous quarter.',
    ],
    tags: ['Redington', 'Apple', 'iPhone', 'Tech Stocks', 'Market'],
    reporterId: 'REP-UP-LKO-1002',
    views: 18900, likes: 980, shares: 530, comments: 125,
    pubHoursAgo: 12, imageUrl: 'https://cdn.zeebiz.com/sites/default/files/2026/09/10/413565-stock-market-bullish.jpg',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'IPO Watch: Three new issues open next week — GMP, dates, and how to apply',
    slug: 'ipo-watch-three-new-issues-open-next-week',
    categoryId: 'cat-market',
    subCategoryId: 'sub-ipo-markets',
    summary: 'Retail investors can bid on three fresh listings opening across fintech, manufacturing and consumer segments next week.',
    paras: [
      'New Delhi: Three initial public offerings are set to open for subscription next week, giving retail investors fresh primary market opportunities.',
      'Each issue carries a retail quota of 35 per cent, and applicants can use UPI-based ASBA to block funds directly in their bank accounts.',
      'Mutual fund houses and high-net-worth individuals are expected to keep the anchor books strong given the recent run of healthy listing gains.',
    ],
    tags: ['IPO', 'Primary Market', 'Subscription', 'GMP', 'Finance'],
    reporterId: 'REP-UP-LKO-1002',
    views: 22400, likes: 1180, shares: 680, comments: 170,
    pubHoursAgo: 13, imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'Mutual Funds: How to allocate your SIP portfolio during high market volatility',
    slug: 'mutual-funds-sip-portfolio-strategy',
    categoryId: 'cat-market',
    subCategoryId: 'sub-mutual-funds',
    summary: 'Financial advisors recommend staggered investing in large and flexi-cap schemes while markets consolidate.',
    paras: [
      'Mumbai: As equity markets undergo volatility, wealth planners advise retail investors not to pause Systematic Investment Plans (SIPs).',
      'Disciplined investing through rupee cost averaging allows investors to accumulate more units when market indices correct.',
      'A balanced allocation across flexi-cap funds, large-and-midcap hybrids, and short-duration debt funds provides stability against sharp swings.',
    ],
    tags: ['Mutual Funds', 'SIP', 'Personal Finance', 'Wealth Creation', 'Investment'],
    reporterId: 'REP-UP-LKO-1002',
    views: 19100, likes: 1020, shares: 590, comments: 140,
    pubHoursAgo: 14, imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    breaking: false, featured: false,
  }),
  makeNews({
    title: 'UP Election 2026: Gorakhpur candidates file nominations as campaign heats up',
    slug: 'up-election-2026-gorakhpur-nominations',
    categoryId: 'cat-social',
    subCategoryId: 'sub-election',
    summary: 'Major parties fielded their candidates today amid heavy security as the election season kicks off in eastern UP.',
    paras: [
      'Gorakhpur: The nomination process for the 2026 Uttar Pradesh assembly elections began here today, with candidates from major parties filing papers amid tight security.',
      'Roadshows and door-to-door campaigns have intensified across the city, with party workers distributing pamphlets in Golghar, Shahpur and the surrounding blocks.',
      'District administration has set up separate counters for candidates and is conducting strict verification of affidavits to ensure a clean nomination process.',
    ],
    tags: ['election', 'gorakhpur', 'politics'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Gorakhpur', 'Gorakhpur', 'Golghar'),
    views: 31200, likes: 2040, shares: 1600, comments: 412,
    pubHoursAgo: 2, imageSeed: 'gorakhpur-election', breaking: true, featured: true,
  }),
  makeNews({
    title: 'Gorakhpur metro: Survey for first corridor completed, DPR expected next month',
    slug: 'gorakhpur-metro-survey-completed',
    categoryId: 'cat-economic',
    summary: 'Geotechnical and ridership studies for the city\'s first metro corridor are complete, officials said.',
    paras: [
      'Gorakhpur: The detailed survey for the city\'s first metro corridor has been completed, and the detailed project report (DPR) is expected to be submitted next month.',
      'The proposed corridor connects the railway station with the university area, passing through the busy Golghar market. Officials said ridership projections indicate strong demand.',
      'Once the DPR is cleared, tenders could be floated within a year. Residents welcomed the plan, which is expected to ease congestion on the city\'s narrow arterial roads.',
    ],
    tags: ['metro', 'gorakhpur', 'infrastructure'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Gorakhpur', 'Gorakhpur'),
    views: 9800, likes: 540, shares: 230, comments: 88,
    pubHoursAgo: 9, imageSeed: 'gkp-metro',
  }),
  makeNews({
    title: 'Jaunpur bypass opens: Lucknow–Varanasi travel time cut by 40 minutes',
    slug: 'jaunpur-bypass-opens',
    categoryId: 'cat-economic',
    summary: 'The 18-km eastern bypass decongests the city and speeds up highway traffic.',
    paras: [
      'Jaunpur: The newly constructed 18-kilometre eastern bypass was opened to traffic today, cutting travel time between Lucknow and Varanasi by roughly 40 minutes.',
      'The bypass diverts heavy vehicles away from the city core, reducing congestion near the old bridge and the main bazaar areas. Commuters reported a smoother, faster ride on the first day.',
      'Authorities said streetlights and lane markings are being installed, and a patrolling team has been deployed for round-the-clock traffic management.',
    ],
    tags: ['bypass', 'jaunpur', 'roads'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Jaunpur', 'Jaunpur'),
    views: 8700, likes: 480, shares: 190, comments: 64,
    pubHoursAgo: 14, imageSeed: 'jaunpur-bypass',
  }),
  makeNews({
    title: 'SBI and PNB hike fixed deposit rates: New rates for 1–3 year tenures announced',
    slug: 'sbi-pnb-hike-fd-rates',
    categoryId: 'cat-market',
    subCategoryId: 'sub-banking',
    summary: 'State-owned lenders raised deposit rates by up to 25 basis points on select tenures.',
    paras: [
      'New Delhi: State Bank of India and Punjab National Bank have hiked fixed deposit interest rates by up to 25 basis points across select tenures, effective this month.',
      'Under the new structure, a 1–3 year retail deposit will now earn up to 7.10 per cent, with senior citizens receiving an additional 50 basis points on most slabs.',
      'Bankers said the hike aligns deposit rates with the prevailing credit growth and improves the yield for savers, especially pensioners who rely on fixed income.',
    ],
    tags: ['banking', 'fd-rates', 'sbi'],
    reporterId: 'REP-UP-LKO-1002',
    views: 11400, likes: 710, shares: 540, comments: 130,
    pubHoursAgo: 18, imageSeed: 'fd-rates',
  }),
  makeNews({
    title: 'Mutual fund SIP inflows hit record ₹28,400 crore in August',
    slug: 'mutual-fund-sip-record-inflows',
    categoryId: 'cat-market',
    subCategoryId: 'sub-mutual-funds',
    summary: 'Monthly systematic investment plans crossed a fresh high as retail participation deepens.',
    paras: [
      'Mumbai: Systematic investment plan (SIP) inflows into mutual funds hit a record ₹28,400 crore in August, data from the association of mutual funds in India showed.',
      'The growth was broad-based, with equity, hybrid and small-cap schemes all witnessing fresh investor money. Industry experts attribute the trend to rising financial awareness in tier-2 and tier-3 cities.',
      'Fund houses expect monthly SIP collections to keep climbing as more salaried investors automate their savings into equity markets.',
    ],
    tags: ['mutual-funds', 'sip', 'investing'],
    reporterId: 'REP-UP-LKO-1002',
    views: 7600, likes: 390, shares: 260, comments: 57,
    pubHoursAgo: 22, imageSeed: 'sip-record',
  }),
  makeNews({
    title: 'India vs Australia: Decider set for Sunday after rain-hit series',
    slug: 'india-australia-decider-sunday',
    categoryId: 'cat-social',
    subCategoryId: 'sub-cricket',
    summary: 'The two sides share honours heading into the final ODI in Lucknow.',
    paras: [
      'Lucknow: The India–Australia One-Day series is all square after rain washed out the penultimate game, setting up a winner-takes-all decider at the Ekana Stadium on Sunday.',
      'Coming on the back of a last-over thriller, both camps are expected to field their strongest XIs. Pitch reports suggest a batting-friendly surface with some help for spinners in the middle overs.',
      'Tickets for the decider are nearly sold out, and the local administration has put additional crowd-control measures in place around the stadium.',
    ],
    tags: ['cricket', 'india', 'australia'],
    reporterId: 'REP-UP-GKP-1003',
    ...L('Uttar Pradesh', 'Lucknow', 'Lucknow'),
    views: 42800, likes: 3210, shares: 2400, comments: 980,
    pubHoursAgo: 5, imageSeed: 'cricket-decider', featured: true,
  }),
  makeNews({
    title: 'Gorakhpur district hospital gets 200 new beds, ICU expansion approved',
    slug: 'gorakhpur-hospital-new-beds',
    categoryId: 'cat-social',
    subCategoryId: 'sub-state-politics',
    summary: 'A capacity upgrade approved for the city\'s main government hospital.',
    paras: [
      'Gorakhpur: The district hospital\'s infrastructure upgrade has been approved, adding 200 new beds and expanding the intensive care unit, officials confirmed.',
      'The expansion includes a new maternity wing, a dedicated paediatric ward and upgraded diagnostic facilities. Work is expected to be completed in phases over the next 12 months.',
      'Health officials said the upgrade will help reduce pressure on referral hospitals in the region and improve access for patients from nearby districts.',
    ],
    tags: ['health', 'hospital', 'gorakhpur'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Gorakhpur', 'Gorakhpur', 'Main Hospital'),
    views: 6800, likes: 330, shares: 140, comments: 45,
    pubHoursAgo: 11, imageSeed: 'hospital-beds',
  }),
  makeNews({
    title: 'UP Board results announced: Pass percentage climbs to 91.4%',
    slug: 'up-board-results-914-pass',
    categoryId: 'cat-social',
    subCategoryId: 'sub-exams',
    summary: 'Girls outperform boys for the 10th consecutive year in class 12 examinations.',
    paras: [
      'Lucknow: The Uttar Pradesh Board of High School and Intermediate Education announced class 12 results today, with the overall pass percentage climbing to 91.4 per cent.',
      'Girls outperformed boys for the tenth consecutive year, according to officials. Results are available on the board\'s website and mobile app.',
      'Educationists welcomed the improvement but stressed the need to focus on skill-based learning alongside board scores in the coming academic session.',
    ],
    tags: ['education', 'up-board', 'results'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Lucknow', 'Lucknow'),
    views: 15600, likes: 1020, shares: 780, comments: 260,
    pubHoursAgo: 7, imageSeed: 'up-board-result',
  }),
  makeNews({
    title: 'EV push: New e-scooters under ₹1 lakh hit showrooms',
    slug: 'ev-scooters-under-1-lakh',
    categoryId: 'cat-auto',
    subCategoryId: 'sub-ev',
    summary: 'Budget electric two-wheelers aim to tempt buyers ahead of the festive season.',
    paras: [
      'New Delhi: With the festive season approaching, several manufacturers are rolling out electric scooters priced under ₹1 lakh, promising range figures between 80 and 130 kilometres.',
      'The new models target first-time buyers and daily commuters, with attractive exchange offers and battery-rental schemes reducing upfront costs further.',
      'Dealers expect a sharp pickup in test rides over the coming weekends as consumers weigh running costs against conventional petrol scooters.',
    ],
    tags: ['ev', 'scooters', 'auto'],
    reporterId: 'REP-UP-LKO-1002',
    views: 10900, likes: 640, shares: 410, comments: 150,
    pubHoursAgo: 16, imageSeed: 'ev-scooters',
  }),
  makeNews({
    title: 'Viral: Jaunpur village\'s simple wedding breaks internet after elaborate ₹2-crore theme',
    slug: 'jaunpur-viral-simple-wedding',
    categoryId: 'cat-viral',
    summary: 'A modest ceremony in a village near Jaunpur has become the talk of social media.',
    paras: [
      'Jaunpur: A simple village wedding has gone viral on social media after netizens compared its low-key charm with a heavily publicised ₹2-crore themed ceremony elsewhere.',
      'The brief ceremony, held at a small family farmhouse near the village, featured traditional songs and a modest feast. Clips posted by guests have crossed millions of views within a day.',
      'The groom\'s family said they plan to donate what they saved to the village school, a decision that has won widespread praise online.',
    ],
    tags: ['viral', 'wedding', 'jaunpur'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Jaunpur', 'Jaunpur', 'Shahganj'),
    views: 29600, likes: 2540, shares: 1980, comments: 640,
    pubHoursAgo: 1, imageSeed: 'viral-wedding', featured: true,
  }),
  makeVideoNews({
    title: 'Zee Business Market Wrap: सेंसेक्स और निफ्टी में भारी उतार-चढ़ाव, अनिल सिंघवी से जानिए रणनीति',
    slug: 'zeebiz-market-wrap-anil-singhvi',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'भारतीय शेयर बाजार में शुक्रवार को भारी उतार-चढ़ाव देखने को मिला। जानिए ज़ी बिज़नेस के मैनेजिंग एडिटर अनिल सिंघवी से आगे की खास रणनीति।',
    paras: [
      'नई दिल्ली: शेयर बाजार में आज के कारोबारी सत्र में भारी उठापटक देखने को मिली। सेंसेक्स और निफ्टी लाल निशान में बंद हुए। आईटी और डिफेंस शेयरों में भारी बिकवाली रही।',
      'ज़ी बिज़नेस के मैनेजिंग एडिटर अनिल सिंघवी ने निवेशकों को सतर्क रहने की सलाह दी और कहा कि मौजूदा गिरावट में चुनिंदा क्वालिटी स्टॉक्स पर ही नजर रखें।',
    ],
    tags: ['market', 'zeebiz', 'anilsinghvi', 'sensex', 'nifty'],
    reporterId: 'REP-DL-CENT-1001',
    views: 34500, likes: 3120, shares: 2100, comments: 450,
    pubHoursAgo: 2,
    youtubeId: 'w8wZ3WqXf8g',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    duration: 312,
  }),
  makeVideoNews({
    title: 'Nifty Realty Plunges 4%: Why Are Realty Stocks Falling? ZeeBiz Analysis',
    slug: 'nifty-realty-plunges-zeebiz-video',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'रियल्टी शेयरों में 4 फीसदी तक की बड़ी गिरावट क्यों आई? जानिए प्रमुख कारण और एक्सपर्ट्स की राय।',
    paras: [
      'मुंबई: निफ्टी रियल्टी इंडेक्स आज 4% तक टूट गया। गोदरेज प्रॉपर्टीज और डीएलएफ जैसी दिग्गज कंपनियों के शेयरों में भारी बिकवाली दर्ज की गई।',
      'मार्केट एक्सपर्ट्स के मुताबिक ब्याज दरों को लेकर अनिश्चितता और वैल्यूएशन कंसर्न्स के चलते निवेशकों ने मुनाफावसूली की है।',
    ],
    tags: ['market', 'realty', 'zeebiz', 'stocks'],
    reporterId: 'REP-MH-MUM-1001',
    views: 28400, likes: 2200, shares: 1650, comments: 310,
    pubHoursAgo: 4,
    youtubeId: 'xRkL2wU8w9U',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    duration: 245,
  }),
  makeVideoNews({
    title: 'Gorakhpur Metro Corridor: पूरा रूट, स्टेशन और बजट की पूरी जानकारी | Ground Report',
    slug: 'gorakhpur-metro-ground-report-video',
    categoryId: 'cat-state',
    summary: 'गोरखपुर में लाइट मेट्रो रेल प्रोजेक्ट के पहले चरण का काम तेजी से शुरू। देखिए रूट मैप और ग्राउंड रिपोर्ट।',
    paras: [
      'गोरखपुर: मुख्यमंत्री योगी आदित्यनाथ के ड्रीम प्रोजेक्ट गोरखपुर मेट्रो को लेकर तैयारियां जोरों पर हैं। 27 स्टेशनों वाले इस कॉरिडोर से शहर को जाम से मुक्ति मिलेगी।',
      'हमारी टीम ने ग्राउंड जीरो पर जाकर स्थानीय नागरिकों और अधिकारियों से बातचीत की और प्रोजेक्ट की वास्तविक स्थिति का जायजा लिया।',
    ],
    tags: ['gorakhpur', 'metro', 'up', 'development'],
    reporterId: 'REP-UP-GKP-1001',
    ...L('Uttar Pradesh', 'Gorakhpur', 'Gorakhpur'),
    views: 39800, likes: 4100, shares: 3200, comments: 890,
    pubHoursAgo: 5,
    youtubeId: '3tmd-ClpJxA',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    duration: 420,
  }),
  makeVideoNews({
    title: 'ZeeBiz Brokerage Calls: 7 Stocks on Analysts\' Watchlists for Tomorrow',
    slug: 'zeebiz-7-stocks-watchlist-video',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'कल के लिए ब्रोकरेज की रडार पर आए ये 7 दमदार स्टॉक्स, जानिए कहां बन रहे हैं कमाई के मौके।',
    paras: [
      'नई दिल्ली: शेयर बाजार में अगले हफ्ते के लिए दिग्गज ब्रोकरेज हाउसेस ने चुनिंदा लार्जकैप और मिडकैप शेयरों पर खरीदारी की राय दी है।',
      'देखिए किस स्टॉक में कितना टारगेट और स्टॉपलॉस रखने की सलाह दी गई है।',
    ],
    tags: ['market', 'brokerage', 'zeebiz', 'targets'],
    reporterId: 'REP-DL-CENT-1001',
    views: 24100, likes: 1980, shares: 1240, comments: 280,
    pubHoursAgo: 7,
    youtubeId: '4D7Ue9lQ8o4',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    duration: 188,
  }),
  makeVideoNews({
    title: 'UP Budget 2026 Special: किसानों और युवाओं के लिए क्या बड़े ऐलान? देखिए पूरा वीडियो',
    slug: 'up-budget-special-bulletin-video',
    categoryId: 'cat-politics',
    summary: 'उत्तर प्रदेश विधानसभा में पेश हुआ बजट। जानिए रोजगार, सड़क और कृषि क्षेत्र को क्या मिला।',
    paras: [
      'लखनऊ: उत्तर प्रदेश सरकार ने वित्तीय वर्ष 2026-27 के लिए ऐतिहासिक बजट पेश किया। बजट में युवाओं के स्वरोजगार और किसानों की सिंचाई योजनाओं पर खास जोर दिया गया है।',
      'देखिए विधानसभा से लाइव कवरेज और विपक्षी दलों की पहली प्रतिक्रिया पर यह विशेष न्यूज़ बुलेटिन।',
    ],
    tags: ['up', 'budget', 'lucknow', 'politics'],
    reporterId: 'REP-UP-LKO-1002',
    ...L('Uttar Pradesh', 'Lucknow', 'Lucknow'),
    views: 45200, likes: 5200, shares: 4100, comments: 1100,
    pubHoursAgo: 8,
    youtubeId: '7b1X3ZJ7LTo',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    duration: 360,
  }),
  makeVideoNews({
    title: 'Vighnaharta Stock Pick: अनिल सिंघवी के पसंदीदा शेयर, जानिए कमाई का शानदार मौका',
    slug: 'vighnaharta-stock-pick-video',
    categoryId: 'cat-market',
    subCategoryId: 'sub-stock-tips',
    summary: 'मार्केट गुरु अनिल सिंघवी ने गणेश चतुर्थी और फेस्टिव सीजन के लिए सुझाए ये मल्टीबैगर स्टॉक्स।',
    paras: [
      'मुंबई: ज़ी बिज़नेस के खास सेगमेंट विघ्नहर्ता स्टॉक पिक में मार्केट गुरु अनिल सिंघवी ने फंडामेंटली मजबूत कंपनियों के नाम बताए हैं।',
      'इन कंपनियों के ऑर्डर बुक और कैश फ्लो बेहद आकर्षक हैं। जानिए लंबी अवधि में कितना रिटर्न दे सकते हैं ये स्टॉक्स।',
    ],
    tags: ['market', 'zeebiz', 'anilsinghvi', 'festivepick'],
    reporterId: 'REP-MH-MUM-1001',
    views: 21900, likes: 1890, shares: 1420, comments: 230,
    pubHoursAgo: 10,
    youtubeId: 'pS5N076Lz10',
    imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    duration: 215,
  }),
  {
    ...makeNews({
      title: 'Gorakhpur Metro: 60 सेकंड में पूरा रूट और स्टेशन गाइड #Shorts',
      slug: 'gorakhpur-metro-short-reel',
      categoryId: 'cat-state',
      summary: 'गोरखपुर लाइट मेट्रो रेल के प्रमुख स्टेशनों की त्वरित जानकारी।',
      paras: ['गोरखपुर मेट्रो के सभी प्रमुख स्टेशनों और इंटरचेंज प्वाइंट्स पर 60 सेकंड का क्विक अपडेट।'],
      tags: ['metro', 'gorakhpur', 'shorts', 'reels'],
      reporterId: 'REP-UP-GKP-1001',
      ...L('Uttar Pradesh', 'Gorakhpur', 'Gorakhpur'),
      views: 65400, likes: 5800, shares: 3200, comments: 450,
      pubHoursAgo: 3,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    }),
    contentType: 'SHORT_VIDEO' as const,
    shortVideoPayload: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    },
    videoPayload: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    },
  } as ContentItem,
  {
    ...makeNews({
      title: 'Market Flash: आज के टॉप 3 गेनर्स और लूजर्स सिर्फ 30 सेकंड में! #Shorts',
      slug: 'market-flash-top-gainers-short-reel',
      categoryId: 'cat-market',
      subCategoryId: 'sub-stock-tips',
      summary: 'निफ्टी और सेंसेक्स के प्रमुख शेयरों में हलचल पर क्विक मार्केट शॉर्ट।',
      paras: ['बाजार बंद होने के बाद जानिए किन शेयरों में रहा सबसे ज्यादा एक्शन।'],
      tags: ['market', 'sensex', 'nifty', 'shorts'],
      reporterId: 'REP-DL-CENT-1001',
      views: 48900, likes: 4120, shares: 2180, comments: 310,
      pubHoursAgo: 5,
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    }),
    contentType: 'SHORT_VIDEO' as const,
    shortVideoPayload: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    },
    videoPayload: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    },
  } as ContentItem,
]

/* ────── Live streams ────── */

export const MOCK_LIVE_STREAMS: LiveStreamItem[] = [
  {
    _id: 'mock-live-cm-gkp',
    title: { en: 'Gorakhpur Metro: Groundbreaking Ceremony — LIVE', hi: 'गोरखपुर मेट्रो शिलान्यास समारोह — लाइव' },
    youtubeUrl: 'https://www.youtube.com/watch?v=yG3aFv-xR80',
    youtubeId: 'yG3aFv-xR80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    status: 'LIVE',
    isActive: true,
    displayOrder: 1,
    createdAt: hoursAgo(2),
  },
  {
    _id: 'mock-live-budget',
    title: { en: 'UP Budget 2026: Live coverage from the Assembly', hi: 'यूपी बजट 2026: विधानसभा से लाइव कवरेज' },
    youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    youtubeId: '5qap5aO4i9A',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    status: 'SCHEDULED',
    isActive: true,
    displayOrder: 2,
    createdAt: hoursAgo(20),
  },
]

/* ────── Comments ────── */

export const MOCK_USERS = [
  { _id: 'mock-user-1', name: 'Ramesh Yadav', avatar: mockImg('user-ramesh', 120, 120) },
  { _id: 'mock-user-2', name: 'Sunita Devi', avatar: mockImg('user-sunita', 120, 120) },
  { _id: 'mock-user-3', name: 'Arun Kumar', avatar: mockImg('user-arun', 120, 120) },
]

export const MOCK_COMMENTS: CommentItem[] = [
  {
    _id: 'mock-c1',
    contentId: 'mock-up-election-2026-gorakhpur-nominations',
    userId: MOCK_USERS[0],
    commentText: 'Great coverage! Waiting for the full candidate list.',
    status: 'APPROVED',
    createdAt: hoursAgo(1),
  },
  {
    _id: 'mock-c2',
    contentId: 'mock-up-election-2026-gorakhpur-nominations',
    userId: MOCK_USERS[2],
    commentText: 'Finally elections with ground reports from the city.',
    status: 'APPROVED',
    createdAt: hoursAgo(1),
  },
  {
    _id: 'mock-c3',
    contentId: 'mock-nifty-record-high-sensex-rally',
    userId: MOCK_USERS[1],
    commentText: 'Very useful update for small investors like me.',
    status: 'APPROVED',
    createdAt: hoursAgo(2),
  },
]