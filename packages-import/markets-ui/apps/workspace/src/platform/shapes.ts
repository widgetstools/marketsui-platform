import type { App } from "@openfin/workspace";

export interface CustomSettings {
  apps?: App[];
}

export interface PlatformSettings {
  id: string;
  title: string;
  icon: string;
}
