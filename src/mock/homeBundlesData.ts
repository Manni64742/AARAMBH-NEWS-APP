import { ContentItem, CategoryItem } from '../types'

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
}

/* ──────────────────────────────────────────────────────────
   1. MARKET & FINANCE (मार्केट व वित्त)
   ────────────────────────────────────────────────────────── */
export const MARKET_SECTION: ThematicSectionData = {
  id: 'sec-market',
  title: 'Market & Finance',
  categorySlug: 'market',
  accentColor: '#FF5722',
  bundles: [
    {
      id: 'bundle-stock-market',
      title: 'Stock Market & Nifty',
      sectionTitle: 'Market & Finance',
      categorySlug: 'market',
      subCategorySlug: 'stock-market',
      accentColor: '#FF5722',
      items: [
        {
          id: 'sm-1',
          tag: 'DIVIDEND ALERT',
          title: 'Dividend Alert: PSU giant announces ₹8.5 interim payout; record date next Friday',
          summary: 'State-owned Maharatna firm declares interim dividend. Board approves payout for eligible shareholders with robust Q3 earnings growth.',
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
          publishedAt: '20m ago',
          views: 24200,
          accentColor: '#FF5722',
        },
        {
          id: 'sm-2',
          tag: 'MARKET MOVERS',
          title: 'Nifty 50 surges past key hurdle; IT and Auto stocks lead broad-based rally',
          summary: 'Benchmark indices open strong fueled by positive Asian market cues, falling crude prices, and renewed domestic institutional inflows.',
          imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80',
          publishedAt: '1h ago',
          views: 31500,
          accentColor: '#00A859',
        },
        {
          id: 'sm-3',
          tag: 'SEBI UPDATE',
          title: 'SEBI proposes simplified derivative margin norms for retail derivatives traders',
          summary: 'Capital markets regulator issues consultation paper aimed at lowering unnecessary volatility while safeguarding retail participants.',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
          publishedAt: '2h ago',
          views: 18900,
          accentColor: '#2563EB',
        },
        {
          id: 'sm-4',
          tag: 'RESULT PREVIEW',
          title: 'Banking Q4 preview: Credit growth seen resilient; asset quality at multi-year highs',
          summary: 'Leading brokerage reports project double-digit loan growth led by retail and SME disbursements across major commercial banks.',
          imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80',
          publishedAt: '3h ago',
          views: 14200,
          accentColor: '#FF5722',
        },
        {
          id: 'sm-5',
          tag: 'SHARE TIPS',
          title: 'Top 3 largecap stock picks by market analysts for a target upside of 18-24%',
          summary: 'Technical breakout patterns observed in power, defense, and capital goods counters with strong fundamental support.',
          imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&q=80',
          publishedAt: '4h ago',
          views: 42100,
          accentColor: '#00A859',
        },
      ],
    },
    {
      id: 'bundle-commodities',
      title: 'Commodity & Gold',
      sectionTitle: 'Market & Finance',
      categorySlug: 'market',
      subCategorySlug: 'commodity-gold',
      accentColor: '#F59E0B',
      items: [
        {
          id: 'com-1',
          tag: 'GOLD PRICE',
          title: 'Gold shines bright: 24-carat prices reclaim ₹74,500 level ahead of festival demand',
          summary: 'Safe-haven buying and easing US bond yields trigger steady rally in domestic bullion markets across major bullion hubs.',
          imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80',
          publishedAt: '35m ago',
          views: 38400,
          accentColor: '#F59E0B',
        },
        {
          id: 'com-2',
          tag: 'CRUDE OIL',
          title: 'Brent crude drops toward $76/barrel amid OPEC+ supply ramp-up expectations',
          summary: 'Oil futures ease slightly as geopolitical risk premiums cool down and global crude inventory estimates show minor build-up.',
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
          publishedAt: '2h ago',
          views: 21900,
          accentColor: '#FF5722',
        },
        {
          id: 'com-3',
          tag: 'SILVER WATCH',
          title: 'Silver futures rally on robust industrial demand from Solar and EV battery makers',
          summary: 'White metal outperforms gold in percentage terms as global green energy capacity targets boost physical spot consumption.',
          imageUrl: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600&q=80',
          publishedAt: '3h ago',
          views: 17800,
          accentColor: '#2563EB',
        },
        {
          id: 'com-4',
          tag: 'METALS',
          title: 'Copper and Aluminium hit fresh multi-week highs on China infrastructure stimulus',
          summary: 'Base metal index records biggest weekly gain in three months on Beijing’s fresh liquidity injection into industrial projects.',
          imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&q=80',
          publishedAt: '5h ago',
          views: 12400,
          accentColor: '#00A859',
        },
        {
          id: 'com-5',
          tag: 'AGRI COMMODITY',
          title: 'Wheat and pulses sowing picks up speed across northern states as weather turns ideal',
          summary: 'Agriculture ministry reports 7% jump in acreage coverage with adequate reservoir storage supporting upcoming harvest outlook.',
          imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
          publishedAt: '6h ago',
          views: 15300,
          accentColor: '#00A859',
        },
      ],
    },
    {
      id: 'bundle-ipo',
      title: 'IPO Watch & Corporate',
      sectionTitle: 'Market & Finance',
      categorySlug: 'market',
      subCategorySlug: 'ipo-watch',
      accentColor: '#2563EB',
      items: [
        {
          id: 'ipo-1',
          tag: 'IPO ALERT',
          title: 'Upcoming Mega IPOs: 4 mainboard issues opening next week; check dates & price band',
          summary: 'Primary market heats up with tech logistics and consumer retail firms preparing to raise over ₹12,000 crore from public markets.',
          imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80',
          publishedAt: '45m ago',
          views: 49200,
          accentColor: '#2563EB',
        },
        {
          id: 'ipo-2',
          tag: 'GREY MARKET',
          title: 'Defense tech IPO GMP jumps 65% ahead of Day 2 subscription numbers',
          summary: 'Grey market premium signals blockbuster listing expectation with high demand in HNI and Qualified Institutional categories.',
          imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&q=80',
          publishedAt: '2h ago',
          views: 33700,
          accentColor: '#FF5722',
        },
        {
          id: 'ipo-3',
          tag: 'LISTING DAY',
          title: 'Fintech unicorn lists at 42% premium over issue price on NSE and BSE',
          summary: 'Strong institutional participation drives market debut above expectations; trading volume crosses ₹2,500 crore in first hour.',
          imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
          publishedAt: '4h ago',
          views: 27900,
          accentColor: '#00A859',
        },
        {
          id: 'ipo-4',
          tag: 'SME IPO',
          title: 'Solar equipment maker SME IPO subscribed 120x on closing day',
          summary: 'Retail quota witnesses staggering 185 times oversubscription as investors rush for renewable manufacturing play.',
          imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&q=80',
          publishedAt: '5h ago',
          views: 16400,
          accentColor: '#F59E0B',
        },
        {
          id: 'ipo-5',
          tag: 'SEBI FILING',
          title: 'Electric two-wheeler giant files draft red herring prospectus for ₹4,500 crore IPO',
          summary: 'Company looks to fund next-gen gigafactory expansion and fast-charging network rollout across tier-2 cities.',
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
          publishedAt: '6h ago',
          views: 22100,
          accentColor: '#2563EB',
        },
      ],
    },
    {
      id: 'bundle-personal-finance',
      title: 'Personal Finance & Tax',
      sectionTitle: 'Market & Finance',
      categorySlug: 'market',
      subCategorySlug: 'personal-finance-tax',
      accentColor: '#00A859',
      items: [
        {
          id: 'pf-1',
          tag: 'FIXED DEPOSIT',
          title: 'Special FD rates up to 8.25%: Senior citizens to earn highest returns before rate cuts',
          summary: 'Major lenders launch limited-period retail deposits offering lucrative returns for tenures between 400 to 555 days.',
          imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
          publishedAt: '1h ago',
          views: 52100,
          accentColor: '#00A859',
        },
        {
          id: 'pf-2',
          tag: 'INCOME TAX',
          title: 'New Tax Regime vs Old: Which gives maximum take-home salary in ₹12 to ₹20 Lakh bracket?',
          summary: 'Detailed calculation breakdown comparing standard deductions, NPS benefits, and 80C exemptions for salaried employees.',
          imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
          publishedAt: '2h ago',
          views: 64500,
          accentColor: '#FF5722',
        },
        {
          id: 'pf-3',
          tag: 'HEALTH INSURANCE',
          title: 'Health Insurance Room Rent Cap: How a small clause can cost you thousands during claim',
          summary: 'IRDAI cautions policyholders on proportionate deduction clauses and highlights cashless anywhere hospital networks.',
          imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
          publishedAt: '3h ago',
          views: 39100,
          accentColor: '#2563EB',
        },
        {
          id: 'pf-4',
          tag: 'UPI PAYMENTS',
          title: 'RBI enhances UPI Lite per-transaction limit to ₹1,000; offline tap & pay rollout begins',
          summary: 'Commuters and grocery shoppers set for faster checkout speeds with NFC-backed contactless wallet transactions.',
          imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80',
          publishedAt: '4h ago',
          views: 47800,
          accentColor: '#00A859',
        },
        {
          id: 'pf-5',
          tag: 'MUTUAL FUNDS',
          title: 'SIP Inflows hit fresh record of ₹23,500 crore in August as small investors stay loyal',
          summary: 'AMFI data reveals active retail accounts surging past 8.5 crore with flexi-cap and multi-asset funds attracting bulk flows.',
          imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80',
          publishedAt: '6h ago',
          views: 33400,
          accentColor: '#FF5722',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   2. SOCIAL & VIRAL (सोशल मीडिया व वायरल)
   ────────────────────────────────────────────────────────── */
export const SOCIAL_SECTION: ThematicSectionData = {
  id: 'sec-social',
  title: 'Social & Viral',
  categorySlug: 'viral-news',
  accentColor: '#EC4899',
  bundles: [
    {
      id: 'bundle-social-buzz',
      title: 'Social Media Buzz',
      sectionTitle: 'Social & Viral',
      categorySlug: 'viral-news',
      subCategorySlug: 'social-buzz',
      accentColor: '#EC4899',
      items: [
        {
          id: 'soc-1',
          tag: 'TRENDING BUZZ',
          title: 'Bengaluru engineer creates AI app to find local street food stalls; wins internet',
          summary: 'Techie’s weekend open-source project maps hidden culinary gems across city lanes, clocking 100k downloads in 48 hours.',
          imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
          publishedAt: '30m ago',
          views: 41200,
          accentColor: '#EC4899',
        },
        {
          id: 'soc-2',
          tag: 'VIRAL POST',
          title: 'ISRO scientist shares heartwarming note on mother’s pride after mission milestone',
          summary: 'Emotional picture and inspiring caption garner millions of likes across X and Instagram with praise from top leaders.',
          imageUrl: 'https://images.unsplash.com/photo-1517976487502-53d9e8790089?w=600&q=80',
          publishedAt: '1h ago',
          views: 58900,
          accentColor: '#00A859',
        },
        {
          id: 'soc-3',
          tag: 'INTERNET HERO',
          title: 'Auto driver in Delhi turns vehicle into free mini-library with books for commuters',
          summary: 'Commuters praise unique initiative aimed at encouraging digital detox and habit of reading during peak traffic jams.',
          imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
          publishedAt: '3h ago',
          views: 36700,
          accentColor: '#2563EB',
        },
        {
          id: 'soc-4',
          tag: 'X TRENDS',
          title: 'Viral photo of teacher crossing raging mountain stream to reach school touches hearts',
          summary: 'Dedication of remote Himalayan village educator sparks calls for immediate bridge construction and award recognition.',
          imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
          publishedAt: '4h ago',
          views: 48300,
          accentColor: '#FF5722',
        },
        {
          id: 'soc-5',
          tag: 'MEME ECONOMY',
          title: 'Cricket umpire’s dramatic wide signal turns into hilarious global meme format',
          summary: 'Flamboyant gesture during domestic T20 match trends worldwide as brands and fans create witty creative adaptations.',
          imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=600&q=80',
          publishedAt: '5h ago',
          views: 31000,
          accentColor: '#EC4899',
        },
      ],
    },
    {
      id: 'bundle-viral-videos',
      title: 'Trending Videos & Stories',
      sectionTitle: 'Social & Viral',
      categorySlug: 'viral-news',
      subCategorySlug: 'trending-videos',
      accentColor: '#8B5CF6',
      items: [
        {
          id: 'vid-1',
          tag: 'MUST WATCH',
          title: 'Watch: Spectacular flash mob at Mumbai airport celebrates Indian folk dance forms',
          summary: 'Over 80 professional dancers surprise international travelers with synchronized Garba and Bhangra performance.',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
          publishedAt: '45m ago',
          views: 78400,
          accentColor: '#8B5CF6',
        },
        {
          id: 'vid-2',
          tag: 'NATURE CLIP',
          title: 'Rare snow leopard cubs spotted in Ladakh high altitude reserve; breathtaking video',
          summary: 'Wildlife sanctuary camera traps record playful mother and cubs, highlighting successful conservation efforts in Himalayas.',
          imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&q=80',
          publishedAt: '2h ago',
          views: 65100,
          accentColor: '#00A859',
        },
        {
          id: 'vid-3',
          tag: 'INSPIRING',
          title: '14-year-old builds low-cost solar drone to help rural farmers inspect crop health',
          summary: 'Young innovator from rural Madhya Pradesh receives national innovation fellowship for indigenous tech design.',
          imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80',
          publishedAt: '3h ago',
          views: 42000,
          accentColor: '#2563EB',
        },
        {
          id: 'vid-4',
          tag: 'RESCUE CLIP',
          title: 'Railway cop rescues passenger slipping onto platform track in miraculous reflex save',
          summary: 'CCTV footage of heroic split-second intervention at platform 2 goes viral; railway minister announces bravery award.',
          imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&q=80',
          publishedAt: '5h ago',
          views: 89300,
          accentColor: '#FF5722',
        },
        {
          id: 'vid-5',
          tag: 'CULTURE',
          title: 'Foreign tourists join village wedding in Rajasthan, learn Ghoomar dance with locals',
          summary: 'Wholesome video shows cultural warmth and hospitality leaving international travelers overjoyed and emotional.',
          imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
          publishedAt: '6h ago',
          views: 53600,
          accentColor: '#8B5CF6',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   3. INTERNATIONAL (देश-विदेश / विश्व)
   ────────────────────────────────────────────────────────── */
export const WORLD_SECTION: ThematicSectionData = {
  id: 'sec-world',
  title: 'International',
  categorySlug: 'world',
  accentColor: '#2563EB',
  bundles: [
    {
      id: 'bundle-global-politics',
      title: 'Global Geopolitics & West',
      sectionTitle: 'International',
      categorySlug: 'world',
      subCategorySlug: 'global-politics',
      accentColor: '#2563EB',
      items: [
        {
          id: 'wor-1',
          tag: 'BRICS SUMMIT',
          title: '18th BRICS Summit: Landmark joint declaration reached on local currency trade settle',
          summary: 'Leaders conclude marathon high-level talks in Kazan agreeing to fast-track multilateral payment connectivity mechanisms.',
          imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80',
          publishedAt: '1h ago',
          views: 44100,
          accentColor: '#2563EB',
        },
        {
          id: 'wor-2',
          tag: 'US ELECTIONS',
          title: 'US Presidential Debate: Key takeaways on foreign policy, tariffs, and tech leadership',
          summary: 'Both campaigns clash fiercely over global trade alliances and semiconductor supply chain national security.',
          imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&q=80',
          publishedAt: '2h ago',
          views: 39800,
          accentColor: '#FF5722',
        },
        {
          id: 'wor-3',
          tag: 'UN CLIMATE',
          title: 'COP Summit: India champions Climate Finance Justice for developing countries',
          summary: 'Delegation stresses historic emissions responsibility and demands affordable green tech transfers for Global South.',
          imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
          publishedAt: '4h ago',
          views: 28400,
          accentColor: '#00A859',
        },
        {
          id: 'wor-4',
          tag: 'DEFENSE STRATEGY',
          title: 'Quad foreign ministers affirm open Indo-Pacific maritime security cooperation',
          summary: 'Joint maritime domain awareness initiative expanded with modern radar and satellite tracking sharing.',
          imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80',
          publishedAt: '5h ago',
          views: 22600,
          accentColor: '#2563EB',
        },
        {
          id: 'wor-5',
          tag: 'GLOBAL TRADE',
          title: 'India-EU Free Trade Agreement talks enter final stretch; breakthrough expected',
          summary: 'Negotiators close gaps on tariff reductions across textiles, machinery, and specialty agricultural commodities.',
          imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&q=80',
          publishedAt: '7h ago',
          views: 31200,
          accentColor: '#00A859',
        },
      ],
    },
    {
      id: 'bundle-asia-pacific',
      title: 'Neighbors & Asia-Pacific',
      sectionTitle: 'International',
      categorySlug: 'world',
      subCategorySlug: 'neighbors-asia',
      accentColor: '#00A859',
      items: [
        {
          id: 'wor-6',
          tag: 'DIPLOMACY',
          title: 'Cross-border power transmission link between India, Nepal, and Bangladesh operational',
          summary: 'Trilateral clean energy corridor marks major leap in regional connectivity and clean hydropower sharing.',
          imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80',
          publishedAt: '2h ago',
          views: 26500,
          accentColor: '#00A859',
        },
        {
          id: 'wor-7',
          tag: 'EAST ASIA',
          title: 'Tokyo and Seoul strengthen semiconductor manufacturing pact with Indian partners',
          summary: 'Tri-nation consortium plans new testing and assembly packaging facilities in Gujarat and Tamil Nadu.',
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
          publishedAt: '3h ago',
          views: 19400,
          accentColor: '#2563EB',
        },
        {
          id: 'wor-8',
          tag: 'INDIAN OCEAN',
          title: 'India extends $50 Million budget support line to Maldives for social infrastructure',
          summary: 'Financial assistance supports essential healthcare facilities, water sanitation projects, and youth training centers.',
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
          publishedAt: '4h ago',
          views: 21100,
          accentColor: '#FF5722',
        },
        {
          id: 'wor-9',
          tag: 'BORDER TRADE',
          title: 'Modern integrated check-post launched at India-Bhutan border for seamless transit',
          summary: 'State-of-the-art logistics terminal features automated cargo scanners and digitized customs clearance gates.',
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
          publishedAt: '6h ago',
          views: 14700,
          accentColor: '#00A859',
        },
        {
          id: 'wor-10',
          tag: 'GULF RELATIONS',
          title: 'India-UAE trade corridor achieves record non-oil commerce milestone in Year 2',
          summary: 'CEPA partnership boosts gem and jewelry exports alongside fintech and cross-border digital rupee remittances.',
          imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
          publishedAt: '8h ago',
          views: 28900,
          accentColor: '#2563EB',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   4. AUTO & TECHNOLOGY (ऑटो व टेक्नोलॉजी)
   ────────────────────────────────────────────────────────── */
export const TECH_AUTO_SECTION: ThematicSectionData = {
  id: 'sec-tech-auto',
  title: 'Auto & Technology',
  categorySlug: 'technology',
  accentColor: '#06B6D4',
  bundles: [
    {
      id: 'bundle-auto',
      title: 'Auto Sector & EVs',
      sectionTitle: 'Auto & Technology',
      categorySlug: 'technology',
      subCategorySlug: 'auto',
      accentColor: '#06B6D4',
      items: [
        {
          id: 'aut-1',
          tag: 'NEW LAUNCH',
          title: 'Next-Gen Electric SUV launched with 550km real-world range starting at ₹16.9 Lakh',
          summary: 'Automaker unveils coupe design loaded with Level 2 ADAS, panoramic glass roof, and 15-minute ultra-fast DC charging.',
          imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
          publishedAt: '1h ago',
          views: 52400,
          accentColor: '#06B6D4',
        },
        {
          id: 'aut-2',
          tag: 'BIKE LAUNCH',
          title: 'Iconic motorcycle brand updates 350cc cruiser with dual-channel ABS & LED styling',
          summary: 'Fresh colorways and tuned exhaust note unveiled; booking opens with introductory festival discount across country.',
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
          publishedAt: '2h ago',
          views: 37100,
          accentColor: '#FF5722',
        },
        {
          id: 'aut-3',
          tag: 'EV POLICY',
          title: 'Government prepares PM E-Drive Scheme with ₹10,900 crore push for electric buses & 2Ws',
          summary: 'Fresh outlay guarantees continuous purchase subsidies and fast-tracks charging infrastructure along major expressways.',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80',
          publishedAt: '4h ago',
          views: 29800,
          accentColor: '#00A859',
        },
        {
          id: 'aut-4',
          tag: 'HIGHWAY TECH',
          title: 'Satellite-based toll collection to roll out on 5,000 km national expressways by March',
          summary: 'GPS and GNSS-enabled tolling will deduct payments directly from linked wallets, eliminating toll plazas and waiting lines.',
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
          publishedAt: '5h ago',
          views: 46200,
          accentColor: '#2563EB',
        },
        {
          id: 'aut-5',
          tag: 'CAR SAFETY',
          title: 'Bharat NCAP awards 5-star crash test safety rating to affordable family MPV',
          summary: 'Indigenous vehicle safety assessment program reveals exceptional structural cabin integrity and adult occupant protection.',
          imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
          publishedAt: '7h ago',
          views: 31800,
          accentColor: '#06B6D4',
        },
      ],
    },
    {
      id: 'bundle-tech-ai',
      title: 'AI & Mobile Tech',
      sectionTitle: 'Auto & Technology',
      categorySlug: 'technology',
      subCategorySlug: 'ai-future-tech',
      accentColor: '#3B82F6',
      items: [
        {
          id: 'tec-1',
          tag: 'AI REVOLUTION',
          title: 'Indian Indic LLM supports 22 official languages with ultra-low latency mobile inference',
          summary: 'Homegrown generative AI model built by Bengaluru research lab enables voice-based government services on budget phones.',
          imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
          publishedAt: '40m ago',
          views: 48900,
          accentColor: '#3B82F6',
        },
        {
          id: 'tec-2',
          tag: 'SMARTPHONE',
          title: 'Flagship smartphone arrives with 200MP periscope zoom and on-device satellite SOS',
          summary: 'Next-generation silicon chip promises 40% improved power efficiency and seamless gaming frame rates at 120Hz.',
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
          publishedAt: '3h ago',
          views: 34500,
          accentColor: '#FF5722',
        },
        {
          id: 'tec-3',
          tag: 'CHIP INDUSTRY',
          title: 'India Semiconductor Mission: Commercial chip production slated to begin by mid-2026',
          summary: 'Micron and Tata Electronics mega-fab facilities in Dholera and Sanand enter final clean-room equipment installation.',
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
          publishedAt: '4h ago',
          views: 41200,
          accentColor: '#00A859',
        },
        {
          id: 'tec-4',
          tag: 'CYBER ALERT',
          title: 'CERT-In issues critical advisory on WhatsApp and Telegram voice call phishing scams',
          summary: 'Security watchdog outlines safety steps to identify deepfake audio clones requesting urgent bank account transfers.',
          imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80',
          publishedAt: '6h ago',
          views: 56700,
          accentColor: '#FF5722',
        },
        {
          id: 'tec-5',
          tag: 'SPACE TECH',
          title: 'Private space startup successfully test-fires 3D-printed cryogenic rocket engine',
          summary: 'Historic milestone paves way for regular commercial satellite launches from new Sriharikota private launchpad.',
          imageUrl: 'https://images.unsplash.com/photo-1517976487502-53d9e8790089?w=600&q=80',
          publishedAt: '8h ago',
          views: 29500,
          accentColor: '#3B82F6',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   5. BUSINESS & ECONOMY (बिजनेस व अर्थव्यवस्था)
   ────────────────────────────────────────────────────────── */
export const BUSINESS_SECTION: ThematicSectionData = {
  id: 'sec-business',
  title: 'Business & Economy',
  categorySlug: 'business',
  accentColor: '#10B981',
  bundles: [
    {
      id: 'bundle-economy',
      title: 'Economy & Corporate',
      sectionTitle: 'Business & Economy',
      categorySlug: 'business',
      subCategorySlug: 'economy-budget',
      accentColor: '#10B981',
      items: [
        {
          id: 'bus-1',
          tag: 'GDP GROWTH',
          title: 'World Bank projects Indian GDP growth at 7.0%; retains fastest-growing economy tag',
          summary: 'Strong public capital expenditure, buoyant services exports, and stabilizing rural demand anchor macroeconomic stability.',
          imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
          publishedAt: '1h ago',
          views: 39500,
          accentColor: '#10B981',
        },
        {
          id: 'bus-2',
          tag: 'GST REVENUE',
          title: 'Monthly GST collections cross ₹1.82 Lakh crore on compliance & festival shopping',
          summary: 'Finance Ministry records 10.5% year-on-year growth driven by electronic waybill digitization and anti-evasion drives.',
          imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
          publishedAt: '2h ago',
          views: 43100,
          accentColor: '#FF5722',
        },
        {
          id: 'bus-3',
          tag: 'REAL ESTATE',
          title: 'Premium housing sales jump 38% in Top 7 Indian cities; luxury inventory drops',
          summary: 'Homebuyers prioritize ready-to-move integrated townships in Gurugram, Bengaluru, and Pune by tier-1 branded developers.',
          imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
          publishedAt: '4h ago',
          views: 28700,
          accentColor: '#2563EB',
        },
        {
          id: 'bus-4',
          tag: 'STARTUPS',
          title: 'Quick commerce startup raises $250 Million funding round at $3.5 Billion valuation',
          summary: 'Capital infusion aimed at doubling micro-warehouses and expanding 10-minute electronics delivery network across 40 cities.',
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=600&q=80',
          publishedAt: '5h ago',
          views: 35600,
          accentColor: '#10B981',
        },
        {
          id: 'bus-5',
          tag: 'BANKING',
          title: 'Public sector banks achieve combined net profit of over ₹1.4 Lakh crore in FY25',
          summary: 'Decisive asset quality clean-up, low net NPAs, and elevated net interest margins power historic financial turnaround.',
          imageUrl: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=600&q=80',
          publishedAt: '7h ago',
          views: 31200,
          accentColor: '#FF5722',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   6. INDIA & POLITICS (भारत व राजनीति)
   ────────────────────────────────────────────────────────── */
export const INDIA_SECTION: ThematicSectionData = {
  id: 'sec-india',
  title: 'India & National',
  categorySlug: 'india',
  accentColor: '#FF5722',
  bundles: [
    {
      id: 'bundle-national',
      title: 'National & Governance',
      sectionTitle: 'India & National',
      categorySlug: 'india',
      subCategorySlug: 'national-politics',
      accentColor: '#FF5722',
      items: [
        {
          id: 'ind-1',
          tag: 'GOVERNMENT',
          title: 'Cabinet approves ₹76,000 crore Vadhvan Mega Port project in Maharashtra',
          summary: 'World-class deep-draft port to rank among global top 10 container hubs with direct deep-sea navigation capacity.',
          imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&q=80',
          publishedAt: '1h ago',
          views: 45600,
          accentColor: '#FF5722',
        },
        {
          id: 'ind-2',
          tag: 'PARLIAMENT',
          title: 'Uniform Civil Code committee submits comprehensive draft report to Union Ministry',
          summary: 'Recommendations focus on gender equality, equal property inheritance rights, and streamlined marriage registrations.',
          imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80',
          publishedAt: '2h ago',
          views: 61200,
          accentColor: '#2563EB',
        },
        {
          id: 'ind-3',
          tag: 'INFRASTRUCTURE',
          title: 'Vande Bharat Sleeper trains to commence commercial operations on Delhi-Mumbai corridor',
          summary: 'Aerodynamic 160 km/h train sets equipped with sensor-based interiors and anti-collision Kavach safety tech.',
          imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80',
          publishedAt: '4h ago',
          views: 52800,
          accentColor: '#00A859',
        },
        {
          id: 'ind-4',
          tag: 'SCHEMES',
          title: 'PM Surya Ghar Muft Bijli Yojana surpasses 1.3 Crore rooftop registrations',
          summary: 'Subsidized 3kW solar systems provide up to 300 units of free power per month to middle-class households.',
          imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&q=80',
          publishedAt: '5h ago',
          views: 39400,
          accentColor: '#FF5722',
        },
        {
          id: 'ind-5',
          tag: 'HIGHWAYS',
          title: 'Delhi-Dehradun Expressway opens: Travel time cut to just 2.5 hours through wildlife corridor',
          summary: 'Asia’s longest elevated 12 km wildlife corridor safeguards Rajaji National Park fauna while speeding transit.',
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
          publishedAt: '6h ago',
          views: 48900,
          accentColor: '#00A859',
        },
      ],
    },
  ],
}

/* ──────────────────────────────────────────────────────────
   7. TRENDING STORIES (01 to 05) - Redesigned with Brand Accents
   ────────────────────────────────────────────────────────── */
export const TRENDING_RANKED_ITEMS: TrendingRankItem[] = [
  {
    rank: '01',
    id: 'tr-1',
    tag: 'FESTIVAL SPECIAL',
    title: 'Ganesh Chaturthi Long Weekend: 5 trending travel destinations with special train schedules',
    summary: 'Indian Railways announces 300+ special holiday train trips; flight bookings jump 45% as travelers plan 4-day festive getaways.',
    viewsCount: '128K Reads',
    accentColor: '#FF5722', // Aarambh Vibrant Orange
    imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&q=80',
  },
  {
    rank: '02',
    id: 'tr-2',
    tag: 'PUBLIC HEALTH',
    title: 'Dengue & Viral Fever Prevention: State authorities issue advisory; free testing centers launched',
    summary: 'Health department deploys special vector control taskforce across residential colonies and school campuses.',
    viewsCount: '94K Reads',
    accentColor: '#00A859', // Aarambh Emerald Green
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
  },
  {
    rank: '03',
    id: 'tr-3',
    tag: 'GOLD SURGE',
    title: 'Gold touches new historic peak: Why central banks are aggressively buying bullion reserves',
    summary: 'De-dollarization wave and macroeconomic hedges drive sovereign gold accumulation to 50-year highs.',
    viewsCount: '86K Reads',
    accentColor: '#F59E0B', // Amber Gold
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80',
  },
  {
    rank: '04',
    id: 'tr-4',
    tag: 'TECH MILESTONE',
    title: 'India’s first commercial quantum computer prototype unveiled by IISc scientists in Bengaluru',
    summary: 'Breakthrough quantum processor to revolutionize pharmaceutical drug discovery and encrypted financial networks.',
    viewsCount: '71K Reads',
    accentColor: '#2563EB', // Royal Blue
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
  },
  {
    rank: '05',
    id: 'tr-5',
    tag: 'AVIATION UPDATE',
    title: 'Noida International Airport Jewar completes calibration flights; commercial launch on schedule',
    summary: 'DGCA inspects ILS navigational aids and runway friction tests ahead of inaugural passenger flight operations.',
    viewsCount: '63K Reads',
    accentColor: '#8B5CF6', // Purple
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&q=80',
  },
]

/* ──────────────────────────────────────────────────────────
   8. MOST READ (सर्वाधिक पढ़े गए)
   ────────────────────────────────────────────────────────── */
export const MOST_READ_ITEMS: BundleNewsItem[] = [
  {
    id: 'mr-1',
    tag: 'CORPORATE UPDATE',
    title: 'RBI clears deck for mega conglomerate holding company listing by next financial quarter',
    summary: 'Regulatory approval comes after structural capital adequacy benchmarks are fulfilled; market valuation estimated above ₹16 Lakh crore.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    publishedAt: '2h ago',
    views: 92400,
    accentColor: '#FF5722',
  },
  {
    id: 'mr-2',
    tag: 'RETAIL BOOM',
    title: 'Reliance Retail expands smart commerce footprint to 5,000 new tier-3 towns before Diwali',
    summary: 'Rapid fulfillment network enables direct farmer-to-consumer supply chains, slashing delivery turnaround times by 40%.',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=600&q=80',
    publishedAt: '3h ago',
    views: 78100,
    accentColor: '#00A859',
  },
  {
    id: 'mr-3',
    tag: 'RBI MONETARY POLICY',
    title: 'RBI Monetary Policy: Repo rate kept steady at 6.5%, GDP growth forecast revised upwards',
    summary: 'Monetary Policy Committee maintains balanced inflation stance while noting robust rural consumption and private capex.',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80',
    publishedAt: '4h ago',
    views: 69500,
    accentColor: '#2563EB',
  },
]

/* ──────────────────────────────────────────────────────────
   9. LATEST HEADLINES (ताज़ा सुर्खियां)
   ────────────────────────────────────────────────────────── */
export const LATEST_HEADLINE_ITEMS: BundleNewsItem[] = [
  {
    id: 'lh-1',
    tag: 'BREAKING NEWS',
    title: 'Supreme Court bench upholds state powers to levy tax on mineral rights and mining lands',
    summary: 'Constitution bench ruling provides major revenue boost to mineral-rich states including Odisha, Jharkhand, and Chhattisgarh.',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
    publishedAt: '15m ago',
    views: 34100,
    accentColor: '#FF5722',
  },
  {
    id: 'lh-2',
    tag: 'DEFENSE WATCH',
    title: 'Indian Navy commissions second indigenous guided-missile stealth destroyer into western fleet',
    summary: 'Warship features 75% indigenous content equipped with BrahMos supersonic missiles and anti-submarine rocket systems.',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80',
    publishedAt: '45m ago',
    views: 29800,
    accentColor: '#00A859',
  },
  {
    id: 'lh-3',
    tag: 'WEATHER ALERT',
    title: 'IMD issues orange alert for central states as monsoon revival brings widespread rainfall',
    summary: 'Active low-pressure depression over Bay of Bengal to bring heavy showers, replenishing reservoirs and dams.',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80',
    publishedAt: '1h ago',
    views: 24500,
    accentColor: '#2563EB',
  },
]

/* ──────────────────────────────────────────────────────────
   10. LOCALIZATION & TRANSLATIONS MAP
   ────────────────────────────────────────────────────────── */
export const TAG_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'DIVIDEND ALERT': { en: 'Dividend Alert', hi: 'डिविडेंड अलर्ट' },
  'MARKET MOVERS': { en: 'Market Movers', hi: 'मार्केट मूवर्स' },
  'SEBI UPDATE': { en: 'SEBI Update', hi: 'सेबी अपडेट' },
  'RESULT PREVIEW': { en: 'Result Preview', hi: 'नतीजे व अनुमान' },
  'SHARE TIPS': { en: 'Share Tips', hi: 'शेयर टिप्स' },
  'COMMODITY': { en: 'Commodity', hi: 'कमोडिटी' },
  'CRUDE OIL': { en: 'Crude Oil', hi: 'कच्चा तेल' },
  'PRECIOUS METALS': { en: 'Precious Metals', hi: 'सोना-चांदी' },
  'METALS RALLY': { en: 'Metals Rally', hi: 'मेटल्स रैली' },
  'AGRI COMMODITY': { en: 'Agri Commodity', hi: 'कृषि कमोडिटी' },
  'IPO ALERT': { en: 'IPO Alert', hi: 'आईपीओ अलर्ट' },
  'DEFENSE IPO': { en: 'Defense IPO', hi: 'डिफेंस आईपीओ' },
  'LISTING GAINS': { en: 'Listing Gains', hi: 'लिस्टिंग गेन' },
  'SME ISSUE': { en: 'SME Issue', hi: 'एसएमई आईपीओ' },
  'EV EXPANSION': { en: 'EV Expansion', hi: 'ईवी विस्तार' },
  'BANKING FD': { en: 'Banking FD', hi: 'बैंक एफडी' },
  'TAX PLANNING': { en: 'Tax Planning', hi: 'टैक्स प्लानिंग' },
  'INSURANCE TIPS': { en: 'Insurance Tips', hi: 'बीमा सलाह' },
  'DIGITAL PAYMENTS': { en: 'Digital Payments', hi: 'डिजिटल पेमेंट्स' },
  'MUTUAL FUNDS': { en: 'Mutual Funds', hi: 'म्यूचुअल फंड' },
  'VIRAL TREND': { en: 'Viral Trend', hi: 'वायरल ट्रेंड' },
  'SPACE TECH': { en: 'Space Tech', hi: 'स्पेस टेक' },
  'INSPIRING INDIA': { en: 'Inspiring India', hi: 'प्रेरणादायक' },
  'HEARTWARMING': { en: 'Heartwarming', hi: 'दिल को छूने वाली' },
  'MEME CORNER': { en: 'Meme Corner', hi: 'मीम कॉर्नर' },
  'VIRAL DANCE': { en: 'Viral Dance', hi: 'वायरल डांस' },
  'WILDLIFE WONDER': { en: 'Wildlife Wonder', hi: 'वन्यजीव' },
  'YOUNG INNOVATOR': { en: 'Young Innovator', hi: 'युवा नवाचार' },
  'HEROIC SAVE': { en: 'Heroic Save', hi: 'जांबाज बचाव' },
  'CULTURAL VIBES': { en: 'Cultural Vibes', hi: 'सांस्कृतिक झलक' },
  'BRICS SUMMIT': { en: 'BRICS Summit', hi: 'ब्रिक्स सम्मेलन' },
  'US ELECTIONS': { en: 'US Elections', hi: 'अमेरिकी चुनाव' },
  'CLIMATE ACTION': { en: 'Climate Action', hi: 'जलवायु संरक्षण' },
  'QUAD DIPLOMACY': { en: 'Quad Diplomacy', hi: 'क्वाड कूटनीति' },
  'GLOBAL TRADE': { en: 'Global Trade', hi: 'वैश्विक व्यापार' },
  'NEIGHBORHOOD': { en: 'Neighborhood', hi: 'पड़ोसी देश' },
  'DEFENSE DRILL': { en: 'Defense Drill', hi: 'रक्षा अभ्यास' },
  'INDO-PACIFIC': { en: 'Indo-Pacific', hi: 'इंडो-पैसिफिक' },
  'CHIP DIPLOMACY': { en: 'Chip Diplomacy', hi: 'चिप कूटनीति' },
  'WALL STREET': { en: 'Wall Street', hi: 'वॉल स्ट्रीट' },
  'AI RACE': { en: 'AI Race', hi: 'एआई रेस' },
  'CENTRAL BANKS': { en: 'Central Banks', hi: 'केंद्रीय बैंक' },
  'ENERGY SECURITY': { en: 'Energy Security', hi: 'ऊर्जा सुरक्षा' },
  'AVIATION GIANT': { en: 'Aviation Giant', hi: 'विमानन क्षेत्र' },
  'FLAGSHIP PHONES': { en: 'Flagship Phones', hi: 'फ्लैगशिप फोन' },
  'CHIP BREAKTHROUGH': { en: 'Chip Breakthrough', hi: 'चिप तकनीक' },
  'OPERATING SYSTEM': { en: 'Operating System', hi: 'ऑपरेटिंग सिस्टम' },
  'CAMERA TECH': { en: 'Camera Tech', hi: 'कैमरा तकनीक' },
  'AUDIO INNOVATION': { en: 'Audio Innovation', hi: 'ऑडियो तकनीक' },
  'COMMERCIAL EV': { en: 'Commercial EV', hi: 'कमर्शियल ईवी' },
  'CHARGING TECH': { en: 'Charging Tech', hi: 'चार्जिंग इंफ्रा' },
  'HIGHWAY RACING': { en: 'Automobile', hi: 'ऑटोमोबाइल' },
  'BATTERY TECH': { en: 'Battery Tech', hi: 'बैटरी तकनीक' },
  'SAFETY RATING': { en: 'Safety Rating', hi: 'सुरक्षा रेटिंग' },
  'ENTERPRISE AI': { en: 'Enterprise AI', hi: 'एंटरप्राइज एआई' },
  'QUANTUM LEAP': { en: 'Quantum Leap', hi: 'क्वांटम तकनीक' },
  'CYBER SECURITY': { en: 'Cyber Security', hi: 'साइबर सुरक्षा' },
  'ROBOTICS': { en: 'Robotics', hi: 'रोबोटिक्स' },
  'GENERATIVE AI': { en: 'Generative AI', hi: 'जेनरेटिव एआई' },
  'TELECOM EXPANSION': { en: 'Telecom Expansion', hi: 'दूरसंचार' },
  'AUTO CONGLOMERATE': { en: 'Auto Conglomerate', hi: 'ऑटो दिग्गज' },
  'GREEN HYDROGEN': { en: 'Green Hydrogen', hi: 'ग्रीन हाइड्रोजन' },
  'PORTS LOGISTICS': { en: 'Ports & Logistics', hi: 'बंदरगाह व लॉजिस्टिक्स' },
  'CONSUMER FMCG': { en: 'Consumer FMCG', hi: 'एफएमसीजी' },
  'QUICK COMMERCE': { en: 'Quick Commerce', hi: 'क्विक कॉमर्स' },
  'DEEP TECH': { en: 'Deep Tech', hi: 'डीप टेक' },
  'FINTECH UNICORN': { en: 'Fintech Unicorn', hi: 'फिनटेक यूनिकॉर्न' },
  'AGRITECH': { en: 'AgriTech', hi: 'एग्रीटेक' },
  'HEALTH TECH': { en: 'Health Tech', hi: 'हेल्थ टेक' },
  'PARLIAMENT WATCH': { en: 'Parliament Watch', hi: 'संसद समाचार' },
  'RAILWAY REFORMS': { en: 'Railway Reforms', hi: 'रेलवे सुधार' },
  'INFRASTRUCTURE': { en: 'Infrastructure', hi: 'बुनियादी ढांचा' },
  'SCHEMES': { en: 'Schemes', hi: 'सरकारी योजनाएं' },
  'HIGHWAYS': { en: 'Highways', hi: 'एक्सप्रेसवे' },
  'FESTIVAL SPECIAL': { en: 'Festival Special', hi: 'त्योहार विशेष' },
  'PUBLIC HEALTH': { en: 'Public Health', hi: 'स्वास्थ्य अलर्ट' },
  'GOLD SURGE': { en: 'Gold Surge', hi: 'सोने की चमक' },
  'TECH MILESTONE': { en: 'Tech Milestone', hi: 'तकनीकी उपलब्धि' },
  'AVIATION UPDATE': { en: 'Aviation Update', hi: 'एविएशन अपडेट' },
  'CORPORATE UPDATE': { en: 'Corporate Update', hi: 'कॉर्पोरेट अपडेट' },
  'RETAIL BOOM': { en: 'Retail Boom', hi: 'रिटेल बूम' },
  'RBI MONETARY POLICY': { en: 'RBI Monetary Policy', hi: 'आरबीआई मौद्रिक नीति' },
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

export function getLocalizedTrendingItems(language: string = 'en'): TrendingRankItem[] {
  return TRENDING_RANKED_ITEMS.map((item) => ({
    ...item,
    tag: getLocalizedTag(item.tag, language),
  }))
}

export function getLocalizedMostReadItems(language: string = 'en'): BundleNewsItem[] {
  return MOST_READ_ITEMS.map((item) => ({
    ...item,
    tag: getLocalizedTag(item.tag, language),
  }))
}

export const SECTION_TITLE_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'sec-market': { en: 'Market & Finance', hi: 'मार्केट और वित्त' },
  'sec-social': { en: 'Social & Viral', hi: 'सोशल और वायरल' },
  'sec-world': { en: 'World & International', hi: 'विदेश और दुनिया' },
  'sec-tech': { en: 'Auto & Technology', hi: 'ऑटो और टेक्नोलॉजी' },
  'sec-business': { en: 'Business & Economy', hi: 'उद्योग और व्यापार' },
  'sec-india': { en: 'National & Politics', hi: 'देश और राजनीति' },
}

export const BUNDLE_TITLE_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'bundle-stock-market': { en: 'Stock Market & Nifty', hi: 'शेयर बाज़ार और निफ्टी' },
  'bundle-commodities': { en: 'Commodity & Gold', hi: 'कमोडिटी और सोना-चांदी' },
  'bundle-ipos': { en: 'IPO Watch & Corporate', hi: 'आईपीओ और कॉर्पोरेट' },
  'bundle-personal-finance': { en: 'Personal Finance & Tax', hi: 'पर्सनल फाइनेंस और टैक्स' },
  'bundle-social-buzz': { en: 'Social Media Buzz', hi: 'सोशल मीडिया बज़' },
  'bundle-viral-stories': { en: 'Trending Videos & Stories', hi: 'ट्रेंडिंग वीडियो और स्टोरीज़' },
  'bundle-geopolitics': { en: 'Global Geopolitics & West', hi: 'वैश्विक भू-राजनीति' },
  'bundle-neighbors': { en: 'Neighbors & Asia-Pacific', hi: 'पड़ोसी देश और एशिया-प्रशांत' },
  'bundle-global-econ': { en: 'Global Economy & Tech', hi: 'वैश्विक अर्थव्यवस्था' },
  'bundle-gadgets': { en: 'Gadgets & Smartphones', hi: 'गैजेट्स और स्मार्टफोन' },
  'bundle-ev': { en: 'Electric Vehicles & Auto', hi: 'इलेक्ट्रिक वाहन और ऑटो' },
  'bundle-ai': { en: 'AI & Future Tech', hi: 'एआई और तकनीक' },
  'bundle-corporate': { en: 'Corporate Giants', hi: 'कॉर्पोरेट जगत' },
  'bundle-startups': { en: 'Startups & Venture', hi: 'स्टार्टअप्स और वेंचर' },
  'bundle-governance': { en: 'Governance & Policy', hi: 'शासन और नीतियां' },
}

function localizeThematicSection(sec: ThematicSectionData, language: string): ThematicSectionData {
  const isHi = language === 'hi'
  const secTitle = isHi
    ? (SECTION_TITLE_TRANSLATIONS[sec.id]?.hi || sec.title)
    : (SECTION_TITLE_TRANSLATIONS[sec.id]?.en || sec.title)

  return {
    ...sec,
    title: secTitle,
    bundles: sec.bundles.map((b) => {
      const bundleTitle = isHi
        ? (BUNDLE_TITLE_TRANSLATIONS[b.id]?.hi || b.title)
        : (BUNDLE_TITLE_TRANSLATIONS[b.id]?.en || b.title)

      return {
        ...b,
        title: bundleTitle,
        sectionTitle: secTitle,
        items: b.items.map((item) => ({
          ...item,
          tag: getLocalizedTag(item.tag, language),
        })),
      }
    }),
  }
}

/* ──────────────────────────────────────────────────────────
   11. DYNAMIC SECTIONS BUILDER
   Automatically builds sections from categories loaded from API,
   ensuring any newly added category (e.g. "UP Election") renders seamlessly!
   ────────────────────────────────────────────────────────── */
export function getDynamicThematicSections(
  categories: CategoryItem[] = [],
  language: string = 'en'
): ThematicSectionData[] {
  // If no categories loaded yet, return default curated sections localized
  if (!Array.isArray(categories) || categories.length === 0) {
    return [
      localizeThematicSection(MARKET_SECTION, language),
      localizeThematicSection(SOCIAL_SECTION, language),
      localizeThematicSection(WORLD_SECTION, language),
      localizeThematicSection(TECH_AUTO_SECTION, language),
      localizeThematicSection(BUSINESS_SECTION, language),
      localizeThematicSection(INDIA_SECTION, language),
    ]
  }

  const sections: ThematicSectionData[] = []
  const processedSlugs = new Set<string>()

  // 1. First prioritize Market & Finance at top
  const marketCat = categories.find(
    (c) => c.slug === 'market' || c.slug === 'share-market' || c.slug === 'finance'
  )
  if (marketCat && !processedSlugs.has('market')) {
    sections.push(localizeThematicSection(MARKET_SECTION, language))
    processedSlugs.add('market')
    processedSlugs.add(marketCat.slug)
  }

  // 2. Add Social & Viral
  const socialCat = categories.find((c) => c.slug === 'viral-news' || c.slug === 'social')
  if (socialCat && !processedSlugs.has('viral-news')) {
    sections.push(localizeThematicSection(SOCIAL_SECTION, language))
    processedSlugs.add('viral-news')
    processedSlugs.add(socialCat.slug)
  }

  // 3. Add International (World)
  const worldCat = categories.find((c) => c.slug === 'world' || c.slug === 'international')
  if (worldCat && !processedSlugs.has('world')) {
    sections.push(localizeThematicSection(WORLD_SECTION, language))
    processedSlugs.add('world')
    processedSlugs.add(worldCat.slug)
  }

  // 4. Add Tech & Auto
  const techCat = categories.find((c) => c.slug === 'technology' || c.slug === 'auto')
  if (techCat && !processedSlugs.has('technology')) {
    sections.push(localizeThematicSection(TECH_AUTO_SECTION, language))
    processedSlugs.add('technology')
    processedSlugs.add(techCat.slug)
  }

  // 5. Add Business & Economy
  const busCat = categories.find((c) => c.slug === 'business' || c.slug === 'economy')
  if (busCat && !processedSlugs.has('business')) {
    sections.push(localizeThematicSection(BUSINESS_SECTION, language))
    processedSlugs.add('business')
    processedSlugs.add(busCat.slug)
  }

  // 6. Add India & Politics
  const indiaCat = categories.find((c) => c.slug === 'india' || c.slug === 'politics')
  if (indiaCat && !processedSlugs.has('india')) {
    sections.push(localizeThematicSection(INDIA_SECTION, language))
    processedSlugs.add('india')
    processedSlugs.add(indiaCat.slug)
  }

  // 7. DYNAMICALLY HANDLE ANY OTHER / NEW CATEGORIES (e.g. "UP Election", "Sports", etc.)
  for (const cat of categories) {
    if (processedSlugs.has(cat.slug)) continue
    processedSlugs.add(cat.slug)

    const catTitle = language === 'hi' ? (cat.name?.hi || cat.name?.en) : (cat.name?.en || cat.name?.hi)
    const subCats = cat.subCategories || []

    // If this category has subcategories, create a bundle for each subcategory!
    const bundles: BundleCardData[] =
      subCats.length > 0
        ? subCats.slice(0, 4).map((sub, idx) => {
            const subTitle =
              language === 'hi' ? (sub.name?.hi || sub.name?.en) : (sub.name?.en || sub.name?.hi)
            return {
              id: `bundle-${cat.slug}-${sub.slug || idx}`,
              title: subTitle,
              sectionTitle: catTitle,
              categorySlug: cat.slug,
              subCategorySlug: sub.slug,
              accentColor: '#FF5722',
              items: LATEST_HEADLINE_ITEMS.map((item, itemIdx) => ({
                ...item,
                id: `dyn-${cat.slug}-${sub.slug}-${itemIdx}`,
                tag: getLocalizedTag(subTitle.toUpperCase(), language),
                title: `${subTitle}: ${item.title.split(': ')[1] || item.title}`,
              })),
            }
          })
        : [
            {
              id: `bundle-${cat.slug}-main`,
              title: catTitle,
              sectionTitle: catTitle,
              categorySlug: cat.slug,
              accentColor: '#FF5722',
              items: LATEST_HEADLINE_ITEMS.map((item, itemIdx) => ({
                ...item,
                id: `dyn-${cat.slug}-main-${itemIdx}`,
                tag: getLocalizedTag(catTitle.toUpperCase(), language),
              })),
            },
          ]

    sections.push({
      id: `sec-${cat.slug}`,
      title: catTitle,
      categorySlug: cat.slug,
      accentColor: '#FF5722',
      bundles,
    })
  }

  return sections
}

/**
 * Helper to convert BundleNewsItem or TrendingRankItem into a full ContentItem for NewsDetail navigation
 */
export function bundleItemToContentItem(
  b: BundleNewsItem | TrendingRankItem,
  categoryName = 'General'
): ContentItem {
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
