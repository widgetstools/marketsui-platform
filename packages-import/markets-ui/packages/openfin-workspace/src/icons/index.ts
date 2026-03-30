// ─── Trading Icon Registry ───────────────────────────────────────────
//
// Re-exports from @markets/icons-svg/dock-icons which holds the SVG
// strings extracted from individual .svg files in packages/icons-svg/svg/dock/.
//
// All icons use "currentColor" so they adapt to light and dark themes.

export {
  type TradingIcon,
  TRADING_ICONS,
  getIconCategories,
  svgToDataUrl,
} from "@markets/icons-svg/dock-icons";
