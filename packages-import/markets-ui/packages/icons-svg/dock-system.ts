/**
 * Dock system button SVG strings.
 *
 * Each SVG uses stroke="currentColor" so the color can be replaced
 * at runtime by svgToDataUrl() to match the current theme.
 *
 * Source of truth: the .svg files in svg/ (flat structure).
 * These constants are the runtime string representation loaded
 * from those files.
 */

/** Wrench icon — used for the Tools dropdown button. */
export const TOOLS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

/** Gear icon — used for the Dock Editor menu item. */
export const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Outer gear/cog shape -->
  <path d="M12 1.5 L13.5 3.5 L16 3 L17 5.2 L19.5 5.5 L19.5 8 L21.5 9.5 L20.5 11.5 L22 13.5 L20.2 15 L21 17.3 L18.8 18 L18.5 20.5 L16 20.2 L14.5 22 L12.5 20.8 L10 22 L8.5 20.2 L6 20.5 L5.5 18 L3 17.3 L3.8 15 L2 13.5 L3.5 11.5 L2.5 9.5 L4.5 8 L4.5 5.5 L7 5.2 L8 3 L10.5 3.5 L12 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Inner circle -->
  <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

/** Refresh icon — used for "Reload Dock" menu item. */
export const REFRESH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

/** Code/terminal icon — used for "Developer Tools" menu item. */
export const CODE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

/** Download icon — used for "Export Config" menu item. */
export const DOWNLOAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

/** Upload icon — used for "Import Config" menu item. */
export const UPLOAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

/** Sun icon — default theme toggle icon for dark mode. */
export const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

/** Moon icon — default theme toggle icon for light mode. */
export const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

/** Eye icon — used for "Show/Hide Provider" menu item. */
export const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
