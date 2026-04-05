# MarketsUI FI Trading Terminal

A Binance.US-style fixed income trading terminal built with React 19, TypeScript, shadcn/ui, Recharts, AG-Grid Enterprise 35, and Tailwind CSS.

## Tech Stack

| Layer | Package | Version |
|---|---|---|
| Framework | React + TypeScript + Vite | 19 / 5.x |
| Components | shadcn/ui | latest |
| Data grid | AG-Grid Enterprise | 35.2.0 |
| Charts | Recharts | 3.x |
| Styling | Tailwind CSS | 3.4.1 |
| Fonts | JetBrains Mono + Geist | — |

## Project Structure

```
src/
├── App.tsx                        # Root layout & tab routing
├── index.css                      # Global styles + Binance design tokens
├── main.tsx
├── data/
│   └── tradingData.ts             # All simulated bond/market data + types
└── components/
    ├── TopBar.tsx                 # Nav, ticker strip, instrument header
    ├── CandlestickChart.tsx       # Canvas-drawn OHLC chart with MA overlays
    ├── OrderBook.tsx              # Live bid/ask depth + recent trades feed
    ├── TradeTicket.tsx            # Buy/Sell order ticket (Binance layout)
    ├── BottomOrderPanel.tsx       # Open Orders / Order History / Trade History / Funds
    ├── RfqSimulator.tsx           # Full RFQ workbench with simulated dealer quotes
    ├── RiskTab.tsx                # Portfolio risk: DV01, VaR, scenario P&L, limits
    ├── MarketTab.tsx              # Index table, intraday chart, economic calendar
    ├── ResearchTab.tsx            # Research notes with rating badges
    ├── OrdersTab.tsx              # Order blotter with status filters
    ├── AnalyticsTab.tsx           # OAS scatter, duration buckets, P&L attribution
    ├── AnalyticsPanels.tsx        # Bottom strip panels for Trading tab
    ├── YieldCurveChart.tsx        # Recharts yield curve with overlays
    ├── RightPanels.tsx            # Watchlist, Bond Ladder, Order Ticket
    └── ui/                        # shadcn/ui components (40+)
```

## Getting Started

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Bundle to single self-contained HTML (for sharing)
bash scripts/bundle-artifact.sh
```

## AG-Grid Enterprise License

The app uses AG-Grid Enterprise 35.2.0. For production use, replace the empty license key in `BondBlotter.tsx`:

```ts
LicenseManager.setLicenseKey('YOUR_LICENSE_KEY_HERE');
```

Without a valid key, AG-Grid runs in trial mode (watermark only, fully functional).

## Design Tokens

All colors are defined as CSS custom properties in `src/index.css`:

```css
--bn-bg:      #0b0e11   /* page background */
--bn-bg1:     #161a1e   /* panel background */
--bn-bg2:     #1e2329   /* elevated surfaces */
--bn-bg3:     #2b3139   /* selected/hover states */
--bn-border:  #2b3139   /* all dividers */
--bn-green:   #0ecb81   /* buy / positive */
--bn-red:     #f6465d   /* sell / negative */
--bn-yellow:  #f0b90b   /* accent / logo */
```

## ViewServer Integration

To replace simulated data with live ViewServer subscriptions:

```ts
// In BondBlotter.tsx — replace static BONDS array:
const { data } = useSubscription<Bond[]>('FI_BLOTTER_PRICES', { universe: 'IG_CORP' });

// In OrderBook.tsx — replace genLevels() with:
const { data: depth } = useSubscription('FI_DEPTH', { bondId: bond.id });

// In CandlestickChart.tsx — replace generateCandles() with:
const { data: candles } = useSubscription('FI_OHLCV', { bondId: bond.id, interval: '1D' });
```
