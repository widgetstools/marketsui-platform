/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Stub declarations for workspace-platform-starter framework modules.
 * These modules are downloaded at build time and not available during type-checking.
 */
declare module "workspace-platform-starter/bootstrapper" {
  export function init(): Promise<boolean>;
}

declare module "workspace-platform-starter/logger-provider" {
  export function createLogger(name: string): {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

declare module "workspace-platform-starter/platform/platform" {
  export function init(
    platformInitCallback?: (platform: any) => Promise<void>,
    afterInitCallback?: () => Promise<void>,
  ): Promise<boolean>;
}

declare module "workspace-platform-starter/platform/platform-splash" {
  export function open(): Promise<void>;
  export function close(): Promise<void>;
}

declare const fin: any;
