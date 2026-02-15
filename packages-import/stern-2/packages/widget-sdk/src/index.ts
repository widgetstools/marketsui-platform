// @stern/widget-sdk — Stern Widget Framework SDK

// ============================================================================
// Type Definitions
// ============================================================================
export type {
  WidgetConfig,
  WidgetProps,
  WidgetContext,
  WidgetHostProps
} from './types/widget.js';

export type {
  PlatformAdapter,
  ParentIdentity
} from './types/platform.js';

export type {
  SettingsScreenContext,
  SettingsScreenDefinition
} from './types/settings.js';

export type {
  SlotContent,
  WidgetEnhancer,
  ActionContext,
  WidgetExtensionConfig
} from './types/slots.js';

// ============================================================================
// Registry
// ============================================================================
export { WidgetRegistry } from './registry/WidgetRegistry.js';
