/**
 * Icon utilities for the dock editor.
 *
 * Uses Iconify CDN URLs with a baked-in color param.
 * The `iconId` (e.g. "lucide:file-text") is stored in the config
 * so we can regenerate the URL for any theme color on the fly.
 */

const DARK_COLOR = "#ffffff";
const LIGHT_COLOR = "#1a1a2e";

/**
 * Convert an Iconify icon ID to an SVG URL for a specific theme.
 */
export function iconIdToSvgUrl(iconId: string, color = DARK_COLOR): string {
  const [prefix, name] = iconId.split(":");
  if (!prefix || !name) return "";
  return `https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(color)}&height=24`;
}

/**
 * Get both light and dark icon URLs from an icon ID.
 */
export function iconIdToThemedUrls(iconId: string): { dark: string; light: string } {
  return {
    dark: iconIdToSvgUrl(iconId, DARK_COLOR),
    light: iconIdToSvgUrl(iconId, LIGHT_COLOR),
  };
}

/**
 * Extract the iconId from an existing iconUrl.
 * If the URL is from the Iconify API, parse out prefix:name.
 * Otherwise return defaults.
 */
export function parseIconUrl(iconUrl: string | undefined): { iconName: string; iconId: string } {
  if (!iconUrl) return { iconName: "FileText", iconId: "lucide:file-text" };

  const match = iconUrl.match(/api\.iconify\.design\/([^/]+)\/([^.?]+)/);
  if (match) {
    const prefix = match[1];
    const name = match[2];
    const displayName = name.replace(/(^|-)(\w)/g, (_, _dash: string, char: string) => char.toUpperCase());
    return { iconName: displayName, iconId: `${prefix}:${name}` };
  }

  return { iconName: "FileText", iconId: "lucide:file-text" };
}
