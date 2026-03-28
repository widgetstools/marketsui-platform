# Markets React OpenFin Starter — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Reference:** [built-on-openfin/frontend-framework-starter/frameworks/react](https://github.com/built-on-openfin/frontend-framework-starter/tree/main/frameworks/react)

## Overview

A standalone React + OpenFin starter project that replicates all 4 sub-projects from the OpenFin frontend-framework-starter React directory, with trading-themed views using the existing design system at `/Users/develop/projects/design-system/react-app`.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build tool | Vite (all 4 apps) | CRA is deprecated; design system already uses Vite |
| Project structure | npm workspaces monorepo | Shared deps, single install, proper shared package |
| Styling | Reuse design system | Leverages existing 44 components, AG Grid, Tailwind |
| View content | Trading-themed | Blotters, order tickets, instrument views instead of generic demos |
| Relationship to marketsui | Standalone starter | Not the marketsui-reference-react from the design doc |

---

## 1. Project Structure

```
markets/
├── package.json                    # npm workspaces root
├── tsconfig.base.json              # shared TS config
├── vite.config.shared.ts           # shared Vite config factory
├── .gitignore
├── apps/
│   ├── container/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json           # extends ../../tsconfig.base.json
│   │   ├── index.html
│   │   ├── launch.mjs
│   │   ├── public/
│   │   │   └── platform/manifest.fin.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── platform/
│   │       │   └── Provider.tsx
│   │       └── views/
│   │           ├── BlotterView.tsx
│   │           ├── OrderTicketView.tsx
│   │           └── NotificationsView.tsx
│   ├── workspace/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── launch.mjs
│   │   ├── public/
│   │   │   ├── platform/manifest.fin.json
│   │   │   └── views/
│   │   │       ├── blotter.fin.json
│   │   │       └── order-ticket.fin.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── platform/
│   │       │   ├── Provider.tsx
│   │       │   ├── shapes.ts
│   │       │   ├── home.ts
│   │       │   ├── store.ts
│   │       │   ├── dock.ts
│   │       │   └── notifications.ts
│   │       └── views/
│   │           ├── BlotterView.tsx
│   │           └── OrderTicketView.tsx
│   ├── web/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── iframe-broker.html
│   │   ├── public/
│   │   │   ├── default.layout.fin.json
│   │   │   └── manifest.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── config.ts
│   │       ├── provider.ts
│   │       └── iframe-broker.ts
│   └── workspace-platform-starter/
│       ├── package.json
│       ├── vite.config.ts
│       ├── rollup.config.mjs
│       ├── tsconfig.json
│       ├── index.html
│       ├── public/
│       │   ├── manifest.fin.json
│       │   ├── apps.json
│       │   └── splash.html
│       ├── openfin/
│       │   ├── framework/            # WPS framework (external, gitignored)
│       │   └── modules/              # Custom OpenFin modules
│       └── src/
│           ├── main.tsx
│           ├── app.tsx
│           ├── Provider.tsx
│           ├── hooks/
│           │   ├── useOpenFin.tsx
│           │   ├── usePlatformState.tsx
│           │   └── useRaiseIntent.tsx
│           └── views/
│               ├── InstrumentView.tsx
│               └── StateReceiverView.tsx
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   ├── fin.d.ts
│           │   ├── fdc3.d.ts
│           │   └── openfin.ts
│           ├── styles/
│           │   ├── theme.css
│           │   ├── utilities.css
│           │   └── index.css
│           └── utils/
│               ├── launch.ts
│               ├── with-script.tsx
│               └── fdc3-helpers.ts
└── docs/
    ├── MARKETSUI_DESIGN.md
    └── superpowers/specs/
```

---

## 2. Shared Package (`@markets/shared`)

**Purpose:** Eliminates duplication of CSS, type declarations, and utility code that was copy-pasted across all 4 original projects.

### Types (`src/types/`)

- **`fin.d.ts`** — Declares global `fin` variable typed from `@openfin/core`
- **`fdc3.d.ts`** — Declares global `fdc3` variable typed from `@finos/fdc3`
- **`openfin.ts`** — Shared interfaces:
  - `CustomSettings { apps?: AppDefinition[] }`
  - `PlatformSettings { id: string; title: string; icon: string }`
  - `AppDefinition` — app manifest shape with `appId`, `title`, `manifestType`, `manifest`, `icons`, `intents`

### Styles (`src/styles/`)

- **`theme.css`** — CSS custom properties bridging design system Tailwind theme with OpenFin's `--theme-*` variables. Supports dark/light mode via `.theme-light` class toggle.
- **`utilities.css`** — Layout utility classes from the original: `.row`, `.col`, `.fill`, `.gap5`, `.gap10`, `.gap20`, `.gap40`, `.pad0`, `.pad10`, `.pad20`, `.middle`, `.spread`, `.scroll`, `.drag`, `.no-drag`. Form, table, and button styling.
- **`index.css`** — Barrel import of theme + utilities.

### Utilities (`src/utils/`)

- **`launch.ts`** — App launcher supporting all OpenFin manifest types:
  - `AppManifestType.Snapshot` → `platform.applySnapshot()`
  - `AppManifestType.View` → `platform.createView()`
  - `AppManifestType.External` → `fin.System.launchExternalProcess()`
  - Default → `fin.Application.startFromManifest()`

- **`with-script.tsx`** — React HOC that dynamically injects a `<script>` tag into the DOM head. Used to load the OpenFin Anywhere shim for browser-based FDC3 support.

- **`fdc3-helpers.ts`** — Common FDC3 operations:
  - `broadcastInstrument(ticker: string)` — broadcasts `fdc3.instrument` context on user channel
  - `broadcastOnAppChannel(channelName: string, context: Context)` — broadcasts on named app channel
  - `listenForContext(callback)` — adds context listener on user channel
  - `listenOnAppChannel(channelName: string, callback)` — listens on named app channel

---

## 3. Container App (`apps/container/`)

The simplest OpenFin integration pattern. Basic platform init, FDC3 context sharing, notifications.

### Entry Point (`src/main.tsx`)

React Router routes:
- `/` → `App` (landing page with instructions to run `npm run client:container`)
- `/views/blotter` → `BlotterView` wrapped with `WithScript` (loads Anywhere shim)
- `/views/order-ticket` → `OrderTicketView` wrapped with `WithScript`
- `/views/notifications` → `NotificationsView` (no shim needed)
- `/platform/provider` → `Provider` (lazy loaded)

### Platform Provider (`src/platform/Provider.tsx`)

- Calls `fin.Platform.init({})` on mount
- Displays runtime version from `fin.System.getRuntimeInfo()`

### Views

**BlotterView (`src/views/BlotterView.tsx`)**
- Uses design system's AG Grid blotter to display a list of financial instruments
- On row selection, broadcasts the instrument via FDC3 user channel: `fdc3.broadcast({ type: 'fdc3.instrument', id: { ticker } })`
- Also broadcasts on app channel `"INSTRUMENT-CHANNEL"` for direct comms
- Replaces the original View1's simple MSFT broadcast with a real instrument selection flow

**OrderTicketView (`src/views/OrderTicketView.tsx`)**
- Listens for FDC3 instrument context on user channel via `fdc3.addContextListener(null, callback)`
- Listens on app channel `"INSTRUMENT-CHANNEL"` via `fdc3.getOrCreateChannel().addContextListener()`
- When instrument received, populates an order entry form using design system components
- Displays received context as formatted JSON below the form
- Replaces the original View2's simple context display

**NotificationsView (`src/views/NotificationsView.tsx`)**
- Registers with `@openfin/notifications` on mount
- Listens for `notification-action` events
- Button to create trade confirmation notification (transient toast with "Confirm" and "Reject" action buttons)
- Displays notification action results
- Replaces the original View3's generic notification demo

### OpenFin Manifest (`public/platform/manifest.fin.json`)

```json
{
  "runtime": { "version": "43.142.101.2" },
  "platform": {
    "uuid": "markets-container-starter",
    "autoShow": false
  },
  "snapshot": {
    "windows": [{
      "layout": {
        "content": [{
          "type": "row",
          "content": [
            { "componentState": { "url": "http://localhost:5173/views/blotter" } },
            { "componentState": { "url": "http://localhost:5173/views/order-ticket" } },
            { "componentState": { "url": "http://localhost:5173/views/notifications" } }
          ]
        }]
      }
    }]
  }
}
```

All views: `fdc3InteropApi: "2.0"`, `currentContextGroup: "green"`.

---

## 4. Workspace App (`apps/workspace/`)

Full workspace platform with Home, Store, Dock, Notifications, and app management.

### Entry Point (`src/main.tsx`)

React Router routes:
- `/` → `App` (landing page)
- `/views/blotter` → `BlotterView`
- `/views/order-ticket` → `OrderTicketView`
- `/platform/provider` → `Provider`

### Platform Provider (`src/platform/Provider.tsx`)

1. Reads `customSettings` from manifest via `fin.Application.getCurrent().getManifest()`
2. Initializes workspace platform via `@openfin/workspace-platform init()`:
   - Default window options (icon, favicon, pages)
   - Theme: `brandPrimary: '#7B61FF'` (design system purple), `backgroundPrimary: '#1E1F23'`
   - Custom `"launch-app"` action handler
3. On `platform-api-ready`, bootstraps: `registerHome()` + `Home.show()`, `registerStore()`, `registerDock()`, `registerNotifications()`
4. On `close-requested`, deregisters all and quits

### Workspace Modules

**`src/platform/shapes.ts`** — TypeScript interfaces:
- `CustomSettings { apps?: AppDefinition[] }` (uses shared type)
- `PlatformSettings { id: string; title: string; icon: string }`

**`src/platform/home.ts`** — Home provider:
- `onUserInput` maps apps to `HomeSearchResult[]` using `CLITemplate.SimpleText`
- `onResultDispatch` launches selected app via shared `launchApp()`
- Supports manifest types: view, snapshot, manifest, external

**`src/platform/store.ts`** — Storefront:
- Navigation: "Trading Apps" → "All Apps" section
- Landing page with top row grid of apps
- Footer with platform icon and title
- `launchApp` callback for app selection

**`src/platform/dock.ts`** — Dock registration:
- Workspace components: home, store, notifications, switchWorkspace
- "Apps" dropdown button with app entries from manifest

**`src/platform/notifications.ts`** — `Notifications.register()` from `@openfin/workspace/notifications`

### Views

Same trading-themed views as container (BlotterView + OrderTicketView), but without `WithScript` wrapper since workspace apps run natively in OpenFin. BlotterView also integrates notification creation for trade alerts.

### Manifests

- `public/platform/manifest.fin.json`: Runtime 43.142.101.2, UUID `markets-workspace-starter`, `preventQuitOnLastWindowClosed: true`, `customSettings.apps` array with blotter and order-ticket app definitions
- `public/views/blotter.fin.json`: View manifest, FDC3 2.0, context group green
- `public/views/order-ticket.fin.json`: View manifest, FDC3 2.0, context group green

---

## 5. Web App (`apps/web/`)

Browser-only OpenFin via `@openfin/core-web`. No native OpenFin runtime required.

### Build Configuration (`vite.config.ts`)

- `vite-plugin-static-copy` copies `shared-worker.js` from `@openfin/core-web/out/shared-worker.js` to `dist/assets/`
- Multi-page build: `index.html` (main) + `iframe-broker.html` (broker)
- Dev server on default Vite port

### Source Files

**`src/config.ts`**
```typescript
export const SHARED_WORKER_URL = '/assets/shared-worker.js';
export const BROKER_URL = '/iframe-broker.html';
export const LAYOUT_URL = '/default.layout.fin.json';
```

**`src/provider.ts`** — Core Web initialization:
1. Fetches layout snapshot from `LAYOUT_URL`
2. Gets `#layout_container` DOM element
3. Calls `connect()` from `@openfin/core-web` with:
   - `connectionInheritance: "enabled"`
   - `brokerUrl` pointing to iframe-broker
   - `interopConfig`: providerId `"markets-web-layout"`, contextGroup `"green"`
   - `platform: { layoutSnapshot }`
4. `fin.Interop.init("markets-web-layout")`
5. `fin.Platform.Layout.init({ container })`

**`src/iframe-broker.ts`** — `initBrokerConnection()` from `@openfin/core-web/iframe-broker` with shared worker URL.

**`src/main.tsx`** — Calls `init()` then renders `<App />`. Imports `@openfin/core-web/styles.css`.

**`src/App.tsx`** — Design system header with theme toggle + `<main id="layout_container" />`.

### Layout (`public/default.layout.fin.json`)

2x2 grid of views. Each panel loads a trading-themed URL demonstrating design system components in a browser context. Each view has `web.frameName` to control interop inheritance.

### PWA Manifest (`public/manifest.json`)

Standard PWA manifest with interop config (sharedWorkerUrl, brokerUrl, providerId, defaultContextGroup).

---

## 6. Workspace Platform Starter App (`apps/workspace-platform-starter/`)

The most advanced pattern. Wraps the full WPS framework with custom React hooks for FDC3 intents and cross-view state management.

### Build Configuration

- **`vite.config.ts`**: Port 8080, path alias `workspace-platform-starter` → `./openfin/framework`
- **`rollup.config.mjs`**: Builds 30+ OpenFin module bundles from `./openfin/modules/*` (auth, endpoint, init-options, log, actions, analytics, composite, integrations, lifecycle, platform-override, content-creation, share, interop-override)

### Entry (`src/main.tsx` + `src/app.tsx`)

React Router routes:
- `/` → `Provider`
- `/view1` → `InstrumentView`
- `/view2` → `StateReceiverView`

### Custom React Hooks

**`src/hooks/useOpenFin.tsx`** — Full platform bootstrap:
1. Opens splash screen via `platformSplashProvider.open()`
2. Creates logger via `createLogger("Provider")`
3. Gets platform sync: `fin.Platform.getCurrentSync()`
4. On `platform-api-ready`, calls `bootstrap()` from `workspace-platform-starter/bootstrapper`
5. Calls `initializePlatform()` from `workspace-platform-starter/platform/platform`
6. Closes splash on completion
7. `useRef` prevents double initialization in StrictMode

**`src/hooks/usePlatformState.tsx`** — FDC3 app channel-based cross-view state:
- Creates/joins FDC3 app channel by topic name
- Broadcasts context of type `"workspace.platformState"` with payload
- Listens for context changes, returns `[value, setValue]` tuple
- Cleans up listeners on unmount
- Uses `fdc3.getOrCreateChannel()`, `channel.broadcast()`, `channel.getCurrentContext()`, `channel.addContextListener()`

**`src/hooks/useRaiseIntent.tsx`** — Memoized callback: `window.fdc3.raiseIntent(intentName, context)`

### Views

**InstrumentView (`src/views/InstrumentView.tsx`)** — Three trading actions:
- "View Contact" — `raiseIntent('ViewContact', { type: 'fdc3.contact', ... })` for counterparty lookup
- "View Quote" — `raiseIntent('ViewQuote', { type: 'custom.instrument', ... })` for price quote
- "Set global state" — `usePlatformState` broadcasts instrument selection on `"trading-state"` channel
- Uses design system button and instrument display components

**StateReceiverView (`src/views/StateReceiverView.tsx`)** — Displays current value from `usePlatformState("trading-state")`. Live-updating panel showing selected instrument details, styled with design system components.

### Manifests

**`public/apps.json`** — Two inline-view apps:
- `instrument-view`: URL `http://localhost:8080/view1`, fdc3InteropApi 2.0
- `state-receiver-view`: URL `http://localhost:8080/view2`, fdc3InteropApi 2.0, declares `ViewQuote` intent for `custom.instrument`

**`public/manifest.fin.json`** (~500 lines) — Full workspace platform manifest:
- UUID: `markets-workspace-platform-starter`
- Runtime 43.142.101.2
- Extensive permissions (launchExternalProcess, downloadAsset, openUrlWithBrowser)
- Bootstrap config: home, store, dock, notifications all enabled, autoShow dock+home
- Splash screen provider
- Platform modules (wps-platform-override, wps-interop-override, cloud-interop)
- App provider with endpoint URLs for app definitions
- Endpoint provider with local-storage, favorite-storage, context-processor, notification-source modules
- Interop broker with intent resolver, FDC3 2.0 intents (StartCall, StartChat, ViewChart, ViewContact, ViewProfile, ViewQuote, ViewNews, ViewAnalysis, ViewInstrument)

**`public/splash.html`** — Connects via `fin.InterApplicationBus.Channel.connect()` to receive progress updates. Styled with shared CSS.

### OpenFin Framework Directory (`openfin/`)

- `framework/` — WPS framework code (external dependency, gitignored)
- `modules/` — Custom modules built by rollup.config.mjs
- `.eslintignore` — ignores framework/ and modules/

---

## 7. Dependencies

### Root `package.json`

```json
{
  "name": "markets",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:container": "npm run dev -w apps/container",
    "dev:workspace": "npm run dev -w apps/workspace",
    "dev:web": "npm run dev -w apps/web",
    "dev:wps": "npm run dev -w apps/workspace-platform-starter",
    "build": "npm run build --workspaces",
    "client:container": "npm run client -w apps/container",
    "client:workspace": "npm run client -w apps/workspace",
    "lint": "eslint .",
    "typecheck": "tsc --build"
  }
}
```

### Shared TypeScript Config (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### Per-App OpenFin Dependencies

| Package | Container | Workspace | Web | WPS |
|---|---|---|---|---|
| `@openfin/core` | 43.x | 43.x | — | — |
| `@openfin/workspace` | 23.x | 23.x | — | 23.x |
| `@openfin/workspace-platform` | — | 23.x | — | 23.x |
| `@openfin/notifications` | 2.13.x | 2.13.x | — | — |
| `@openfin/core-web` | — | — | 0.43.x | — |
| `@openfin/node-adapter` | 43.x | 43.x | — | — |
| `@openfin/cloud-interop` | — | — | — | 0.43.x |
| `@openfin/openid-connect` | — | — | — | 1.0.x |
| `@openfin/snap-sdk` | — | — | — | 1.3.x |
| `react-router-dom` | 7.x | 7.x | — | 7.x |

### Common Dependencies (all apps)

- React 19.x, React DOM 19.x
- TypeScript 5.8+
- Vite 6.x
- `@finos/fdc3@2.0.3`

### Design System Integration

Referenced as workspace path dependency:
```json
"@design-system/react-app": "file:../../design-system/react-app"
```

Import pattern (direct file imports — the design system has no barrel export):
```typescript
import { ThemeProvider } from '@design-system/react-app/src/components/theme/ThemeProvider';
import { BlotterPanel } from '@design-system/react-app/src/components/trading/fi/BlotterPanel';
import { OrderBook } from '@design-system/react-app/src/components/trading/OrderBook';
import { PriceDisplay } from '@design-system/react-app/src/components/trading/PriceDisplay';
import { PositionsTable } from '@design-system/react-app/src/components/trading/PositionsTable';
import { cn } from '@design-system/react-app/src/lib/utils';
```

---

## 8. Error Handling

- Each view wraps OpenFin API calls in try/catch with user-facing error messages displayed in the UI
- Platform providers handle initialization failures gracefully with error state display
- FDC3 operations degrade gracefully when not in an OpenFin context (check `typeof fin !== 'undefined'` and `typeof fdc3 !== 'undefined'`)
- Notifications registration handles the case where the notifications service is unavailable

---

## 9. Feature Mapping (Original → New)

| Original Feature | Original Location | New Location | Changes |
|---|---|---|---|
| Platform init | container/Provider.tsx | apps/container/src/platform/Provider.tsx | Same API |
| FDC3 user channel broadcast | container/View1 | apps/container/src/views/BlotterView.tsx | Instrument selection instead of hardcoded MSFT |
| FDC3 app channel broadcast | container/View1 | apps/container/src/views/BlotterView.tsx | "INSTRUMENT-CHANNEL" |
| FDC3 context listener | container/View2 | apps/container/src/views/OrderTicketView.tsx | Populates order form |
| Notifications | container/View3 | apps/container/src/views/NotificationsView.tsx | Trade confirmation theme |
| WithScript HOC | container/WithScript.tsx | packages/shared/src/utils/with-script.tsx | Shared |
| Workspace platform init | workspace/Provider.tsx | apps/workspace/src/platform/Provider.tsx | Purple theme (#7B61FF) |
| Home registration | workspace/home.ts | apps/workspace/src/platform/home.ts | Same API |
| Store registration | workspace/store.ts | apps/workspace/src/platform/store.ts | "Trading Apps" naming |
| Dock registration | workspace/dock.ts | apps/workspace/src/platform/dock.ts | Same API |
| App launcher | workspace/launch.ts | packages/shared/src/utils/launch.ts | Shared |
| Core Web connect | web/provider.ts | apps/web/src/provider.ts | Same API |
| Iframe broker | web/iframe-broker.ts | apps/web/src/iframe-broker.ts | Same API |
| useOpenFin hook | wps/useOpenFin.tsx | apps/wps/src/hooks/useOpenFin.tsx | Same API |
| usePlatformState hook | wps/usePlatformState.tsx | apps/wps/src/hooks/usePlatformState.tsx | "trading-state" channel |
| useRaiseIntent hook | wps/useRaiseIntent.tsx | apps/wps/src/hooks/useRaiseIntent.tsx | Same API |
| FDC3 intents | wps/view1 | apps/wps/src/views/InstrumentView.tsx | Trading context |
| Cross-view state | wps/view1+view2 | apps/wps/src/views/ | Trading instrument state |
| Splash screen | wps/splash.html | apps/wps/public/splash.html | Same pattern |
| CSS design system | Duplicated per project | packages/shared/src/styles/ | Single source |
| Type declarations | Duplicated per project | packages/shared/src/types/ | Single source |

---

## 10. Out of Scope

- Testing infrastructure (original has none)
- CI/CD pipelines
- Docker/containerization
- marketsui ecosystem integration (standalone starter)
- Custom OpenFin modules development (WPS uses pre-built modules)
