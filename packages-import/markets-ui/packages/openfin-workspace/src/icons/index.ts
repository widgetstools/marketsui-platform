// ─── Trading Icon Registry ───────────────────────────────────────────
//
// Each icon is a monochrome SVG using "currentColor" so it adapts to
// both light and dark themes. Icons are stored as raw SVG strings and
// converted to data URLs on demand for the OpenFin Dock API.

export interface TradingIcon {
  name: string;
  category: string;
  svg: string;
}

// ─── SVG Icon Definitions ────────────────────────────────────────────

const icons: Record<string, TradingIcon> = {
  // Charts
  "candlestick": {
    name: "Candlestick",
    category: "Charts",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="2" x2="9" y2="6"/><line x1="9" y1="14" x2="9" y2="22"/><rect x="7" y="6" width="4" height="8" fill="currentColor"/><line x1="17" y1="2" x2="17" y2="10"/><line x1="17" y1="18" x2="17" y2="22"/><rect x="15" y="10" width="4" height="8" rx="0"/></svg>`,
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

  // Trading
  "order-book": {
    name: "Order Book",
    category: "Trading",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><path d="M6 6 L9 6" stroke="currentColor" opacity="0.6"/><path d="M6 12 L9 12" stroke="currentColor" opacity="0.6"/><path d="M15 6 L18 6" stroke="currentColor" opacity="0.6"/><path d="M15 12 L18 12" stroke="currentColor" opacity="0.6"/></svg>`,
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
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
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

  // Fixed Income
  "yield-curve": {
    name: "Yield Curve",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18 Q8 6 21 4"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="3" x2="3" y2="20"/><circle cx="6" cy="15" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="20" cy="5" r="1.5" fill="currentColor"/></svg>`,
  },
  "bond": {
    name: "Bond",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><text x="12" y="17" text-anchor="middle" fill="currentColor" font-size="6" font-family="sans-serif" stroke="none">BOND</text></svg>`,
  },
  "coupon": {
    name: "Coupon",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v5h20v-5a3 3 0 0 1 0-6V4H2z"/><line x1="13" y1="4" x2="13" y2="20" stroke-dasharray="2 2"/></svg>`,
  },
  "maturity": {
    name: "Maturity",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/><path d="M21 12 L23 12"/></svg>`,
  },
  "duration": {
    name: "Duration",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="3" x2="3" y2="20"/><rect x="6" y="14" width="3" height="6" fill="currentColor" opacity="0.3"/><rect x="11" y="8" width="3" height="12" fill="currentColor" opacity="0.6"/><rect x="16" y="4" width="3" height="16" fill="currentColor" opacity="0.9"/></svg>`,
  },
  "spread": {
    name: "Spread",
    category: "Fixed Income",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16 Q8 8 21 6" opacity="0.5"/><path d="M3 18 Q8 14 21 14"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="3" x2="3" y2="20"/></svg>`,
  },

  // Equities
  "stock": {
    name: "Stock",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 8 11 12 14 17 7 21 10"/><polyline points="17 7 21 7 21 10"/></svg>`,
  },
  "portfolio": {
    name: "Portfolio",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  },
  "watchlist": {
    name: "Watchlist",
    category: "Equities",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
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

  // General Finance
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
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
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
