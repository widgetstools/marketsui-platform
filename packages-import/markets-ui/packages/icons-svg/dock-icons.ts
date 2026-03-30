/**
 * Dock trading icon SVG strings.
 *
 * Each SVG is loaded from svg/*.svg (flat structure).
 * Uses stroke="currentColor" so the color can be replaced
 * at runtime by svgToDataUrl() to match the current theme.
 */

export interface TradingIcon {
  name: string;
  category: string;
  svg: string;
}

const icons: Record<string, TradingIcon> = {
  "candlestick": {
    name: "Candlestick",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Candlestick 1 - Bearish (hollow/outline) -->
  <line x1="5" y1="4" x2="5" y2="7" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <rect x="3.5" y="7" width="3" height="7" rx="0.5" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
  <line x1="5" y1="14" x2="5" y2="19" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <!-- Candlestick 2 - Bullish (filled) -->
  <line x1="12" y1="6" x2="12" y2="9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  <rect x="10.5" y="9" width="3" height="6" rx="0.5" stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.8"/>
  <line x1="12" y1="15" x2="12" y2="17" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  <!-- Candlestick 3 - Bullish (filled, tallest) -->
  <line x1="19" y1="3" x2="19" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  <rect x="17.5" y="6" width="3" height="8" rx="0.5" stroke="currentColor" stroke-width="1.5" fill="currentColor"/>
  <line x1="19" y1="14" x2="19" y2="20" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
</svg>`,
  },
  "line-chart": {
    name: "Line Chart",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 20 7 12 11 15 15 7 19 10 21 4"/><line x1="3" y1="20" x2="21" y2="20"/></svg>`,
  },
  "bar-chart": {
    name: "Bar Chart",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="8"/><rect x="10" y="6" width="4" height="14"/><rect x="17" y="2" width="4" height="18"/><line x1="1" y1="20" x2="23" y2="20"/></svg>`,
  },
  "area-chart": {
    name: "Area Chart",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20 L7 12 L11 15 L15 7 L19 10 L21 4 L21 20 Z" fill="currentColor" opacity="0.2"/><polyline points="3 20 7 12 11 15 15 7 19 10 21 4"/></svg>`,
  },
  "waterfall": {
    name: "Waterfall",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="3" height="8"/><rect x="7" y="8" width="3" height="6"/><rect x="12" y="6" width="3" height="4"/><rect x="17" y="10" width="3" height="8"/><line x1="1" y1="20" x2="23" y2="20"/></svg>`,
  },
  "heatmap": {
    name: "Heatmap",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="5" fill="currentColor" opacity="0.8"/><rect x="10" y="3" width="5" height="5" fill="currentColor" opacity="0.4"/><rect x="17" y="3" width="5" height="5" fill="currentColor" opacity="0.6"/><rect x="3" y="10" width="5" height="5" fill="currentColor" opacity="0.3"/><rect x="10" y="10" width="5" height="5" fill="currentColor" opacity="0.9"/><rect x="17" y="10" width="5" height="5" fill="currentColor" opacity="0.5"/><rect x="3" y="17" width="5" height="5" fill="currentColor" opacity="0.7"/><rect x="10" y="17" width="5" height="5" fill="currentColor" opacity="0.2"/><rect x="17" y="17" width="5" height="5" fill="currentColor" opacity="0.6"/></svg>`,
  },
  "order-book": {
    name: "Order Book",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Center divider -->
  <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <!-- Buy side (left) - bars from right to left -->
  <rect x="4" y="5" width="7" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
  <rect x="5.5" y="9" width="5.5" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
  <rect x="7" y="13" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
  <rect x="8.5" y="17" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.25"/>
  <!-- Sell side (right) - bars from left to right -->
  <rect x="13" y="5" width="7" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
  <rect x="13" y="9" width="5.5" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
  <rect x="13" y="13" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
  <rect x="13" y="17" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.25"/>
</svg>`,
  },
  "trade-ticket": {
    name: "Trade Ticket",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/><path d="M14 16 L17 13 L20 16" fill="none"/></svg>`,
  },
  "position": {
    name: "Position",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  },
  "pnl": {
    name: "P&L",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Horizontal dividing line -->
  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <!-- P letter -->
  <text x="7" y="10" font-family="sans-serif" font-weight="600" font-size="8" fill="currentColor" text-anchor="middle">P</text>
  <!-- L letter -->
  <text x="17" y="19" font-family="sans-serif" font-weight="600" font-size="8" fill="currentColor" text-anchor="middle">L</text>
  <!-- Up arrow near P -->
  <polyline points="12,9 14,6 16,9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
  <line x1="14" y1="6" x2="14" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
  <!-- Down arrow near L -->
  <polyline points="4,18 6,21 8,18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <line x1="6" y1="14" x2="6" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
</svg>`,
  },
  "risk": {
    name: "Risk",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  },
  "blotter": {
    name: "Blotter",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
  },
  "yield-curve": {
    name: "Yield Curve",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Area fill below curve -->
  <path d="M3 20L7 16Q11 10 14 9L21 7V20H3Z" fill="currentColor" opacity="0.1"/>
  <!-- Curve -->
  <path d="M3 20C5 17 8 13 11 11C14 9 18 8 21 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Data points -->
  <circle cx="7" cy="15" r="1.5" fill="currentColor" opacity="0.5"/>
  <circle cx="12" cy="10.5" r="1.5" fill="currentColor" opacity="0.7"/>
  <circle cx="18" cy="7.5" r="1.5" fill="currentColor"/>
</svg>`,
  },
  "bond": {
    name: "Bond",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Certificate rectangle -->
  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Dollar sign circle -->
  <circle cx="17" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>
  <path d="M17 6.5v3M16.25 7.25c0-.41.34-.75.75-.75s.75.34.75.75-.34.75-.75.75-.75.34-.75.75.34.75.75.75.75-.34.75-.75" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Text lines -->
  <line x1="6" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="6" y1="11.5" x2="14" y2="11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="6" y1="15" x2="11" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <line x1="13" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
</svg>`,
  },
  "coupon": {
    name: "Coupon",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Ticket shape with notches -->
  <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a1.5 1.5 0 1 0 0 3V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4.5a1.5 1.5 0 1 0 0-3V7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Dashed vertical divider -->
  <line x1="14" y1="6" x2="14" y2="8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="14" y1="10" x2="14" y2="12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="14" y1="14" x2="14" y2="16" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="14" y1="17" x2="14" y2="18" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <!-- Percentage symbol on left -->
  <circle cx="7.5" cy="10" r="1" stroke="currentColor" stroke-width="1" opacity="0.8"/>
  <circle cx="10" cy="14" r="1" stroke="currentColor" stroke-width="1" opacity="0.8"/>
  <line x1="10" y1="9.5" x2="7.5" y2="14.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  <!-- Horizontal lines on right -->
  <line x1="16" y1="9.5" x2="19" y2="9.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="16" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="16" y1="14.5" x2="18" y2="14.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
</svg>`,
  },
  "maturity": {
    name: "Maturity",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Calendar body -->
  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Calendar top bar -->
  <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Hangers -->
  <line x1="8" y1="3" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="3" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Date dots -->
  <circle cx="7" cy="12.5" r="0.75" fill="currentColor" opacity="0.3"/>
  <circle cx="10.5" cy="12.5" r="0.75" fill="currentColor" opacity="0.3"/>
  <circle cx="14" cy="12.5" r="0.75" fill="currentColor" opacity="0.3"/>
  <circle cx="17.5" cy="12.5" r="0.75" fill="currentColor" opacity="0.3"/>
  <circle cx="7" cy="16" r="0.75" fill="currentColor" opacity="0.3"/>
  <circle cx="10.5" cy="16" r="0.75" fill="currentColor" opacity="0.3"/>
  <!-- Checkmark on a date -->
  <polyline points="13,16 14.5,17.5 17.5,14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  },
  "duration": {
    name: "Duration",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Clock face -->
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
  <!-- Hour hand -->
  <line x1="12" y1="12" x2="12" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Minute hand -->
  <line x1="12" y1="12" x2="15.5" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="12" cy="12" r="0.75" fill="currentColor"/>
  <!-- Partial arc segment outside -->
  <path d="M17.5 4.1A9.96 9.96 0 0 1 20.5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
  <!-- Hour markers -->
  <line x1="12" y1="3.5" x2="12" y2="4.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="20.5" y1="12" x2="19.5" y2="12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="12" y1="20.5" x2="12" y2="19.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="3.5" y1="12" x2="4.5" y2="12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
</svg>`,
  },
  "spread": {
    name: "Spread",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Shaded area between diverging lines -->
  <path d="M4 12L12 5L20 12L12 19Z" fill="currentColor" opacity="0.08"/>
  <!-- Upper diverging line -->
  <path d="M4 12L12 5L20 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Lower diverging line -->
  <path d="M4 12L12 19L20 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <!-- Center dashed vertical line -->
  <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="12" y1="8" x2="12" y2="11" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="12" y1="13" x2="12" y2="16" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
</svg>`,
  },
  "stock": {
    name: "Stock",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 8 11 12 14 17 7 21 10"/><polyline points="17 7 21 7 21 10"/></svg>`,
  },
  "portfolio": {
    name: "Portfolio",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Segment 1 - largest -->
  <path d="M12 3a9 9 0 0 1 7.79 4.5L12 12V3Z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Segment 2 - medium -->
  <path d="M19.79 7.5A9 9 0 0 1 12 21V12l7.79-4.5Z" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Segment 3 - smallest -->
  <path d="M12 21A9 9 0 0 1 12 3v9l0 9Z" fill="currentColor" opacity="0.08" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Hollow center -->
  <circle cx="12" cy="12" r="4" fill="white" stroke="none"/>
  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="0" opacity="0"/>
</svg>`,
  },
  "watchlist": {
    name: "Watchlist",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Row 1 -->
  <line x1="4" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <polyline points="17,5 18.5,6.5 20.5,4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Row 2 -->
  <line x1="4" y1="12" x2="11" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <polyline points="17,12 20.5,9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <polyline points="18.5,9.5 20.5,9.5 20.5,11.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <!-- Row 3 -->
  <line x1="4" y1="18" x2="10" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <polyline points="17,15.5 18.5,17 20.5,15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
</svg>`,
  },
  "market-data": {
    name: "Market Data",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="7 16 10 10 13 13 17 7"/></svg>`,
  },
  "ticker": {
    name: "Ticker",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="8" rx="1"/><polyline points="5 12 8 10 11 13 14 9 17 11 20 12"/></svg>`,
  },
  "ipo": {
    name: "IPO",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12 L12 6 L16 12"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`,
  },
  "bank": {
    name: "Bank",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><line x1="6" y1="10" x2="6" y2="21"/><line x1="10" y1="10" x2="10" y2="21"/><line x1="14" y1="10" x2="14" y2="21"/><line x1="18" y1="10" x2="18" y2="21"/></svg>`,
  },
  "currency": {
    name: "Currency",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="7"/><circle cx="15" cy="15" r="7"/></svg>`,
  },
  "percentage": {
    name: "Percentage",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  },
  "calculator": {
    name: "Calculator",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="8" y="6" width="8" height="4"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>`,
  },
  "trending-up": {
    name: "Trending Up",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  },
  "trending-down": {
    name: "Trending Down",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
  },
  "globe": {
    name: "Globe",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  "clock": {
    name: "Clock",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  "alert": {
    name: "Alert",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  },
  "settings": {
    name: "Settings",
    category: "General",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Outer gear/cog shape -->
  <path d="M12 1.5 L13.5 3.5 L16 3 L17 5.2 L19.5 5.5 L19.5 8 L21.5 9.5 L20.5 11.5 L22 13.5 L20.2 15 L21 17.3 L18.8 18 L18.5 20.5 L16 20.2 L14.5 22 L12.5 20.8 L10 22 L8.5 20.2 L6 20.5 L5.5 18 L3 17.3 L3.8 15 L2 13.5 L3.5 11.5 L2.5 9.5 L4.5 8 L4.5 5.5 L7 5.2 L8 3 L10.5 3.5 L12 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Inner circle -->
  <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`,
  },
};

export const TRADING_ICONS: Record<string, TradingIcon> = icons;

/**
 * Get all unique icon categories.
 */
export function getIconCategories(): string[] {
  const categories = new Set(Object.values(icons).map((i) => i.category));
  return Array.from(categories).sort();
}

/**
 * Convert an SVG string to a data URL suitable for the OpenFin Dock API.
 *
 * Replaces "currentColor" with the provided color so the icon renders
 * correctly in both light and dark dock themes.
 *
 * @param svg   - Raw SVG string
 * @param color - CSS color to replace currentColor with (default: "#ffffff")
 */
export function svgToDataUrl(svg: string, color: string = "#ffffff"): string {
  const colored = svg.replace(/currentColor/g, color);
  const encoded = btoa(colored);
  return `data:image/svg+xml;base64,${encoded}`;
}
