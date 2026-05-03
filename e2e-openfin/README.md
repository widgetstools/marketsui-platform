# `@marketsui/e2e-openfin` — Playwright-over-CDP harness

Drives a real OpenFin runtime (not browser-mode Chromium) so we can cover
the integration paths the fast `e2e/` suite cannot reach: `fin.me.getOptions()`
against the manifest's `customData`, registered-component metadata stamped on
ConfigService rows, multi-window storage isolation under real OpenFin window
chrome, the per-view active-profile override workspace round-trip, and IAB
theme broadcast across views.

The harness is **opt-in and local-only** — see Constraints in
[`docs/OPENFIN_E2E_HARNESS_WORKLOG.md`](../docs/OPENFIN_E2E_HARNESS_WORKLOG.md)
for why CI integration is out of scope. Run it on your dev box before
merging anything that touches the OpenFin layer; pair the run with the
[manual checklist](./MANUAL_CHECKLIST.md).

---

## Prerequisites

1. **OpenFin RVM installed** (Windows or Mac). The first run downloads the
   pinned runtime declared in
   `apps/markets-ui-react-reference/public/platform/manifest.fin.json`
   (currently `43.142.101.2`); allow ~30s on a clean machine.
2. **Port 9090 free.** `netstat -ano | findstr :9090` should be empty.
   The platform manifest exposes `--remote-debugging-port=9090` and the
   harness fails fast if the port is held — see Constraints in the worklog.
3. **Repo built and installed:** `npm ci --legacy-peer-deps && npm run build`.
   The `--legacy-peer-deps` flag is permanent — see the root `CLAUDE.md`.
4. **Reference-app dev server.** `playwright.config.ts` boots
   `npm run dev -w @marketsui/markets-ui-react-reference` automatically; if
   you already have it running, the `reuseExistingServer: true` flag will
   pick it up.

---

## Run

From the repo root:

```bash
npm run test:e2e:openfin
```

Or from this directory:

```bash
cd e2e-openfin
npx playwright test
```

Filter to a single spec:

```bash
npm run test:e2e:openfin -- --grep "customData"
```

A clean run boots the platform once per worker (Playwright is configured
with `workers: 1` because we share a single OpenFin runtime), opens
test view manifests on demand, and quits the platform when the worker
exits. No orphan `OpenFin.exe` should remain — `tasklist | findstr OpenFin`
after the run is the canonical check.

---

## Layout

| Path | Purpose |
|---|---|
| [`fixtures/openfin.ts`](./fixtures/openfin.ts) | Worker-scoped `platform` + `cdpBrowser` + test-scoped `openView(manifestUrl)` fixtures. |
| [`helpers/launchPlatform.ts`](./helpers/launchPlatform.ts) | TypeScript port of `apps/markets-ui-react-reference/launch.mjs` — boots the platform, awaits `platform-api-ready`, returns a structured handle with a clean `quit()`. |
| [`helpers/connectPlaywright.ts`](./helpers/connectPlaywright.ts) | `chromium.connectOverCDP('http://127.0.0.1:9090')` + page lookup helpers. |
| [`helpers/configReader.ts`](./helpers/configReader.ts) | Read/write ConfigService rows from a Page via the DEV-only `window.__configManager` hook. |
| [`helpers/__smoke__.ts`](./helpers/__smoke__.ts) | Reviewer-only sanity script (`npx tsx helpers/__smoke__.ts`) — proves the runtime connects without involving Playwright. |
| [`tests/`](./tests/) | One spec per parity-matrix concern (see worklog table). |

Test view manifests live in
[`apps/markets-ui-react-reference/public/views/test-blotter-{a,b,template}.fin.json`](../apps/markets-ui-react-reference/public/views/).
Each carries the seven `customData` fields (`instanceId`, `appId`, `userId`,
`componentType`, `componentSubType`, `isTemplate`, `singleton`) the OpenFin
identity path consumes; they are not advertised on the dock and are opened
by direct URL from the harness.

---

## Coverage matrix

Numbered rows match the HostedMarketsGrid parity matrix in
[`docs/HOSTED_MARKETS_GRID_REFACTOR_WORKLOG.md`](../docs/HOSTED_MARKETS_GRID_REFACTOR_WORKLOG.md).

| # | Feature | Spec |
|---|---|---|
| 1, 3, 21 | OpenFin identity via `fin.me.getOptions()` + toolbar info popover | [`tests/03-identity-customdata.spec.ts`](./tests/03-identity-customdata.spec.ts) |
| 4 | Storage rows carry registered-component discriminators | [`tests/04-registered-component-storage.spec.ts`](./tests/04-registered-component-storage.spec.ts) |
| 18 | Multi-window storage isolation per `instanceId` | [`tests/05-multi-window-isolation.spec.ts`](./tests/05-multi-window-isolation.spec.ts) |
| §1.13 | Per-view active-profile override workspace round-trip | [`tests/06-per-view-active-profile-override.spec.ts`](./tests/06-per-view-active-profile-override.spec.ts) |
| 12 | Theme flip via IAB broadcast (single + cross-view) | [`tests/07-theme-flip.spec.ts`](./tests/07-theme-flip.spec.ts) |
| 16 | Provider-picker hotkey (Alt+Shift+P) per-view focus | [`tests/08-provider-picker-hotkey.spec.ts`](./tests/08-provider-picker-hotkey.spec.ts) |
| smoke | Grid mounts under OpenFin chrome | [`tests/02-smoke.spec.ts`](./tests/02-smoke.spec.ts) |

Manual coverage (workspace persistence end-to-end via RVM Save Workspace,
multi-monitor placement, native window-manager interactions, platform-restart
recovery, per-componentSubType visual smoke) lives in
[`MANUAL_CHECKLIST.md`](./MANUAL_CHECKLIST.md).

---

## Troubleshooting

**`Error: connect ECONNREFUSED 127.0.0.1:9090`** — port 9090 isn't listening.
Either the platform didn't boot (RVM not installed → check Prerequisites),
or it crashed during startup (re-run with `DEBUG=pw:browser*` for CDP-side
diagnostics).

**`Port 9090 already in use`** — a prior runtime is still alive.
`tasklist | findstr OpenFin`, then `taskkill /F /IM OpenFin.exe`. The
harness deliberately does not pick a different port (D7 in the worklog).

**`View did not appear: ...test-blotter-a.fin.json`** — the dev server
isn't serving the manifest. Verify
`http://localhost:5174/views/test-blotter-a.fin.json` returns JSON; if not,
restart `npm run dev -w @marketsui/markets-ui-react-reference`.

**Runtime download stuck on first run** — RVM is fetching `43.142.101.2`.
Allow ~30s; if it stalls, kill the process and retry. Some corporate
proxies block the OpenFin CDN — escalate to your IT team.

**`window.__configManager is not defined`** — the storage spec depends on
a `import.meta.env.DEV`-gated debug hook in the reference app's `main.tsx`.
Production bundles deliberately do not expose it. Make sure you're hitting
the dev server, not a `vite preview` of `dist/`.

---

## Design decisions and worklog

The full reasoning trail (why option 2 + option 3, why a separate workspace,
why CDP-attach instead of `@openfin/automation-helpers`, why per-test view
UUIDs) is in
[`docs/OPENFIN_E2E_HARNESS_WORKLOG.md`](../docs/OPENFIN_E2E_HARNESS_WORKLOG.md).
Read it before adding new specs.
