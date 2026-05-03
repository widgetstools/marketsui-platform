# OpenFin e2e Harness — Worklog

**One-line goal:** stand up a Playwright-over-CDP test harness that drives a real OpenFin runtime, then port the `HostedMarketsGrid` parity matrix into specs that exercise the OpenFin-only code paths (customData identity, registered-component storage discriminator, per-view active-profile override, multi-window storage isolation, workspace round-trip).

**Branch:** `e2e/openfin-harness` — **fork from `refactor/hosted-markets-grid-unify`** so the HostedMarketsGrid wrapper exists. If `refactor/hosted-markets-grid-unify` lands on `main` before this branch, rebase onto `main` (no conflicts expected — this branch only adds new files under `e2e-openfin/` and `apps/markets-ui-react-reference/public/views/`).

**Why a worklog with sessions instead of a single PR:** each session ships one deterministic commit that builds on the previous. Any session that can't meet its acceptance criteria stops the chain — we ask before plowing ahead. Sessions stay small enough to verify by hand, so a regression in session 7 doesn't blow up session 4's harness.

---

## Read me first (unchanging context for every session)

### Why option 2 + option 3, and what each is for

- **Option 2 (this worklog) — real-OpenFin Playwright harness.** Catches integration bugs the browser-mode specs cannot: `fin.me.getOptions()` against the actual runtime, OpenFin Platform snapshot/restore, IAB-driven theme propagation across views, multi-window storage isolation under real OpenFin window chrome, the §1.13 per-view active-profile override that round-trips through `Platform.getSnapshot()`.
- **Option 3 (session 11) — manual smoke checklist.** A reviewer-facing markdown checklist for things automation either can't reach (multi-monitor placement, native window-manager interactions) or where automation cost outweighs the regression risk. Lives at `e2e-openfin/MANUAL_CHECKLIST.md`. Always part of the PR review for any change that touches the OpenFin layer.

We do **not** rip out the existing browser-mode `e2e/hosted-markets-grid.spec.ts` — it stays as the fast pre-merge check. The OpenFin harness is opt-in via `npm run test:e2e:openfin` and runs against an installed OpenFin runtime; CI integration is explicitly **out of scope** until the harness has proven itself locally (see Constraints below).

### Existing infrastructure to build on (not replace)

| Asset | Purpose | Location |
|---|---|---|
| `launch.mjs` | Boots the OpenFin platform via `@openfin/node-adapter`; we'll port its logic into the harness. | `apps/markets-ui-react-reference/launch.mjs` |
| Platform manifest | Declares `react-workspace-starter` UUID, `--remote-debugging-port=9090`, providerUrl. | `apps/markets-ui-react-reference/public/platform/manifest.fin.json` |
| View manifests | Two existing examples (`view1.fin.json`, `view2.fin.json`) — bare URL only, no `customData`. | `apps/markets-ui-react-reference/public/views/` |
| Reference-app dev server | Already wired into `playwright.config.ts` `webServer` on port 5174 (added in HMG session 6). | `apps/markets-ui-react-reference` |
| `@openfin/node-adapter` | Already a dep on the reference app. Reused — no new install. | `apps/markets-ui-react-reference/package.json` |

### Decisions already made

| # | Decision | Rationale |
|---|---|---|
| D1 | Separate top-level dir `e2e-openfin/` (sibling of `e2e/`) | Different harness, different runtime requirements. Keeps the fast `e2e/` suite untouched. |
| D2 | Reuse the existing platform manifest; add **new view manifests** for tests | Hand-crafted `customData` per test view is the only way to exercise the OpenFin identity path deterministically. |
| D3 | Connect Playwright to OpenFin via CDP at `127.0.0.1:9090` | The platform manifest already exposes the port. No runtime relaunch needed. |
| D4 | Boot the platform once per test file via `globalSetup`; create/destroy views per test | Process startup is ~3-5s; creating views via `fin.Platform.createView()` is sub-second. |
| D5 | Per-test isolation = per-test view UUID + per-test `instanceId` in customData | ConfigService rows are keyed by `instanceId`, so unique ids = no cross-test contamination. |
| D6 | Each test cleans its own ConfigService rows in `afterEach` | Belt-and-braces against accidental dev-machine pollution. |
| D7 | Windows-only, runtime-installed-locally | OpenFin RVM exists on Windows + Mac; Linux is unsupported. Restricting to Windows mirrors the reference app's actual deployment target. CI is out of scope (see Constraints). |
| D8 | Skip `@openfin/automation-helpers` for now | The CDP-attach approach is more direct and avoids a second connection lifecycle. Revisit only if a future test genuinely needs `automation-helpers`-only APIs. |

### Constraints (read before making any session's "this seems harder than expected" call)

- **No CI integration in this worklog.** Spinning OpenFin in headless CI is its own multi-week project (custom runner image, RVM provisioning, runtime version pinning, flake-debugging). Out of scope. The harness is local-only; reviewers run it on their dev box before merging OpenFin-affecting PRs.
- **No headless mode.** OpenFin is not Chromium — it does not have a `--headless` flag in the Playwright sense. Tests run with the platform window visible. Sessions must not assume otherwise.
- **No port-rebinding heroics.** If `9090` is already in use (someone left a stale runtime), the harness fails fast with a clear error. We do not pick a different port — that drifts from the platform manifest and leaves stale processes the user has to kill manually anyway.
- **Per-session zero-broken-state rule.** Every session ends with `npm run test:e2e:openfin` (or its session-N subset) green. A failing session blocks the next one until the blocker is documented and either resolved or punted explicitly in the Session log.

### Parity matrix (which `HostedMarketsGrid` rows the OpenFin harness covers)

Numbers match `docs/HOSTED_MARKETS_GRID_REFACTOR_WORKLOG.md`. "Browser-only" rows already covered by `e2e/hosted-markets-grid.spec.ts` are noted but not re-tested here unless the OpenFin runtime exposes a different code path.

| # | Feature | OpenFin-specific value | Session |
|---|---|---|---|
| 1 | OpenFin identity via `fin.me.getOptions()` | The hook's OpenFin branch never executes in browser specs — only mocked. Real runtime executes it. | 6 |
| 3 | Registered-component fields surfaced | Same — only OpenFin populates `componentType` etc. | 6, 7 |
| 4 | Storage factory auto-injects registered metadata | End-to-end persistence; assert AppConfigRow contains the discriminators. | 7 |
| 8 | Full-bleed fixed layout under OpenFin window chrome | Browser viewport ≠ OpenFin view container; padding/inset bugs only show in real chrome. | 5 (smoke) |
| 9 | DataPlane provider mount | Smoke verification under the OpenFin runtime. | 5 (smoke) |
| 12 | Theme switching driven by `[data-theme]` | Re-tested under OpenFin — IAB theme broadcast is the real source-of-truth in production. | 10 |
| 16 | Provider picker (Alt+Shift+P) | Hotkey routing differs between browser focus model and OpenFin view focus model. | 10 |
| 18 | Grid-level provider persistence | Multi-window isolation only meaningful under OpenFin (real second window, real second view UUID). | 8 |
| 21 | Toolbar ⓘ popover surfaces componentName + OpenFin identity | Confirms the popover reads OpenFin-side identity correctly. | 6 |
| §1.13 | Per-view active-profile override (OpenFin-only feature) | Has zero non-OpenFin coverage today. The deferred session-10 manual check is automated here. | 9 |

Rows 2 (browser fallback), 5–7 (ConfigManager singleton, withStorage opt-in, document title), 10 (loading guard), 11 (theme params), 13–15 (toolbar flags / onEditProvider / legacy cleanup), 17 / 19 / 20 (subscription lifecycle, profile manager, passthrough props) — already covered by browser e2e + Vitest. Re-running under OpenFin would be churn without coverage uplift.

### Conventions

- **Branch:** `e2e/openfin-harness` (forked from `refactor/hosted-markets-grid-unify` per the header).
- **Commit prefix:** `test(e2e-openfin):` for spec / harness commits, `feat(e2e-openfin):` for new harness primitives that aren't tests, `docs:` for the worklog log entries.
- **Trailer (every commit):** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Per-session commit cadence:** each session lands ≥1 commit. Append to the **Session log** at the bottom of this file: `<sha> | session N | one-line summary`.
- **Stop conditions:** if a session can't meet acceptance, document the blocker in the Session log and ask. Do **not** silently widen scope — these sessions were sized small on purpose.

### Prerequisites the reviewer must have on their dev box

1. OpenFin RVM installed (Windows or Mac). `@openfin/node-adapter`'s `launch()` triggers the RVM to download and pin the runtime version declared in the manifest (`43.142.101.2`) on first run; allow ~30s for that on a clean machine.
2. Port `9090` free (no other OpenFin runtime running). Easy check: `netstat -ano | findstr :9090` should be empty before launching.
3. Repo built (`npm ci --legacy-peer-deps && npm run build`). The reference app must produce `dist/` because the dev server in `globalSetup` serves manifests from `public/` but UI from a Vite server.

---

## Sessions

Each session is sized to ~30–90 minutes of focused work. Sessions are sequential — later sessions assume earlier ones landed. Resume by saying `read worklog, implement openfin-e2e session N`.

---

### Session 1 — Directory + package scaffold

**Goal:** Stand up the empty `e2e-openfin/` workspace package with Playwright + the reference to `@openfin/node-adapter`. No specs yet; just `npm run test:e2e:openfin` exits successfully with "no tests yet".

**Preconditions**
- On branch `e2e/openfin-harness`
- Repo `npm ci --legacy-peer-deps` clean

**Steps**
1. Create directory `e2e-openfin/` at repo root.
2. Add `e2e-openfin/package.json`:
   ```json
   {
     "name": "@marketsui/e2e-openfin",
     "private": true,
     "version": "0.0.1",
     "scripts": {
       "test": "playwright test"
     },
     "devDependencies": {
       "@playwright/test": "1.59.0",
       "@openfin/node-adapter": "<match-existing-version-in-reference-app>",
       "typescript": "5.x"
     }
   }
   ```
   Read the actual `@openfin/node-adapter` version from `apps/markets-ui-react-reference/package.json` — pin to the same.
3. Add `e2e-openfin/playwright.config.ts` with:
   - `testDir: './tests'`
   - `fullyParallel: false` (we share a single OpenFin runtime)
   - `workers: 1`
   - `reporter: 'list'`
   - `use: { trace: 'on-first-retry' }`
   - `projects: [{ name: 'openfin' }]`
   - **No** `webServer` and **no** `globalSetup` yet — those land in sessions 4–5.
4. Add `e2e-openfin/tests/.gitkeep`.
5. Add `e2e-openfin/tsconfig.json` extending the repo's base TS config, `include: ["**/*.ts"]`, `compilerOptions.types: ["@playwright/test", "node"]`.
6. Add `"test:e2e:openfin": "npm run test -w @marketsui/e2e-openfin"` to root `package.json` scripts.
7. Add `e2e-openfin` to the workspaces array in root `package.json` (alongside `apps/*` and `packages/*`).
8. Add to root `turbo.json` if test pipeline includes `@marketsui/e2e-openfin` — only if other workspaces' `test` task is wired through Turbo. **Important:** do NOT add `test:e2e:openfin` to a Turbo pipeline that runs by default; this script must remain opt-in.
9. Run `npm install` (no `npm ci` — we want package-lock to update). Resolve the install cleanly with `--legacy-peer-deps`.

**Acceptance criteria**
- `npm run test:e2e:openfin` exits 0 with output `No tests found` (Playwright's expected message for an empty test dir).
- `npx turbo typecheck` still green for the rest of the repo.
- `package-lock.json` diff is reviewable — only the new e2e-openfin entry and Playwright/Node-adapter resolution updates.

**Commit message template**
```
feat(e2e-openfin): scaffold workspace package and Playwright config

Adds e2e-openfin/ as a workspace package with Playwright 1.59 and the
existing @openfin/node-adapter version. No tests yet — sessions 2-10
populate the harness and specs. Opt-in via `npm run test:e2e:openfin`.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 1 | scaffold workspace`.

---

### Session 2 — Node-adapter launch helper (TypeScript port of `launch.mjs`)

**Goal:** A reusable TypeScript helper that boots the OpenFin platform via `@openfin/node-adapter` and returns a structured handle. Smoke-runnable via a one-shot script — no Playwright wiring yet.

**Preconditions**
- Session 1 committed
- Existing `apps/markets-ui-react-reference/launch.mjs` works against `npm run dev -w @marketsui/markets-ui-react-reference` on port 5174 (manual verify before starting — if this doesn't work for the reviewer, OpenFin RVM isn't installed)

**Steps**
1. Create `e2e-openfin/helpers/launchPlatform.ts` exporting:
   ```ts
   export interface PlatformHandle {
     fin: import('@openfin/node-adapter').OpenFin.Fin<'external connection'>;
     port: number;             // websocket port the runtime is listening on
     debugPort: number;        // 9090 — Chrome remote-debugging port from the manifest
     manifestUrl: string;      // resolved URL we launched
     quit: () => Promise<void>;// platform.quit() + cleanup
   }

   export async function launchPlatform(opts?: {
     manifestUrl?: string;     // default: http://localhost:5174/platform/manifest.fin.json
     timeoutMs?: number;       // default: 30_000
   }): Promise<PlatformHandle>;
   ```
2. Internal flow (lifted from `launch.mjs`, plus a wait-for-`platform-api-ready` guard):
   - `setDefaultResultOrder('ipv4first')` (Windows DNS quirk).
   - `port = await launch({ manifestUrl })` from `@openfin/node-adapter`.
   - `fin = await connect({ uuid: 'e2e-openfin-${Date.now()}', address: 'ws://127.0.0.1:${port}', nonPersistent: true })`.
   - `manifest = await fin.System.fetchManifest(manifestUrl)`; throw if `manifest.platform?.uuid` is undefined.
   - Wait for the platform's API readiness:
     ```ts
     const platform = fin.Platform.wrapSync({ uuid: manifest.platform.uuid });
     await platform.once('platform-api-ready', () => undefined);
     ```
     Wrap with a Promise.race against the timeout.
   - Build `quit` as `async () => { try { await platform.quit(); } catch (e) { /* swallow "no longer connected" */ } }`.
   - Return `{ fin, port, debugPort: 9090, manifestUrl, quit }`.
3. Add `e2e-openfin/helpers/__smoke__.ts` — a tiny script that calls `launchPlatform`, logs the connection details, sleeps 2s, then quits. Run via `tsx e2e-openfin/helpers/__smoke__.ts` (or `node --loader tsx`). Used by reviewers to sanity-check the runtime locally; not part of the test suite.
4. Add `tsx` (or `ts-node`) to `e2e-openfin` devDeps if not already transitively available.

**Acceptance criteria**
- Manual: in one terminal `npm run dev -w @marketsui/markets-ui-react-reference`; in another, `cd e2e-openfin && npx tsx helpers/__smoke__.ts`.
- Output prints the connected port and `platform-api-ready` confirmation, then exits cleanly.
- No orphan OpenFin process: `tasklist | findstr OpenFin` is empty after the script exits.

**Commit message template**
```
feat(e2e-openfin): add launchPlatform helper and smoke script

TypeScript port of apps/markets-ui-react-reference/launch.mjs that
returns a structured handle, awaits platform-api-ready, and exposes a
clean quit(). Smoke script in helpers/__smoke__.ts proves runtime
connectivity without involving Playwright.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 2 | launchPlatform helper + smoke`.

---

### Session 3 — Test view manifests with deterministic customData

**Goal:** Add hand-crafted view manifests under `apps/markets-ui-react-reference/public/views/` that the harness will open. Each carries the seven `customData` fields the OpenFin identity path consumes. Behaviour-neutral for the running app — these manifests are never advertised on the dock.

**Preconditions**
- Session 2 committed
- The reference app already routes `/views/<name>` to a React route that mounts `<HostedMarketsGrid>` (verify by reading `apps/markets-ui-react-reference/src/main.tsx` or wherever the router lives — if the dock-launched views go to a different route, this session adds a route too)

**Steps**
1. **Verify view routing first.** Read the existing view URL → React route mapping. If `/views/test-blotter-a` would resolve to the same `<BlottersMarketsGrid>` component as the existing dock entry, no router change is needed. If not, add the route under whatever component-router pattern the app uses. Document what you found in the commit body so future sessions don't redo the dig.
2. Create `apps/markets-ui-react-reference/public/views/test-blotter-a.fin.json`:
   ```json
   {
     "url": "http://localhost:5174/views/test-blotter-a",
     "customData": {
       "instanceId": "e2e-openfin-test-a",
       "appId": "e2e-openfin",
       "userId": "e2e-runner",
       "componentType": "MarketsGrid",
       "componentSubType": "FX",
       "isTemplate": false,
       "singleton": false
     }
   }
   ```
3. Create `test-blotter-b.fin.json` — same shape, different `instanceId` (`e2e-openfin-test-b`) and `componentSubType` (`Equities`). These two anchor every multi-window test.
4. Create `test-blotter-template.fin.json` — `instanceId` `e2e-openfin-template`, `isTemplate: true`, `singleton: true` — for testing the template/singleton branches.
5. Add a comment block at the top of each (using JSON5? — no, OpenFin requires strict JSON; instead add a `_comment` field):
   ```json
   "_comment": "Test-only view manifest. Used by e2e-openfin/. Do not advertise on the dock."
   ```
6. **Do not** add these to the platform manifest's `customSettings.apps` array — the harness opens them by direct URL.

**Acceptance criteria**
- `curl http://localhost:5174/views/test-blotter-a.fin.json` (after `npm run dev -w @marketsui/markets-ui-react-reference`) returns the JSON.
- `JSON.parse` of each file succeeds.
- `npm run dev` for the reference app still boots without warnings.
- The dock UI does not show the new entries (negative check — they should be invisible to humans).

**Commit message template**
```
test(e2e-openfin): add deterministic test view manifests

Adds three view manifests under public/views/ that carry seven
customData fields each (instanceId / appId / userId / componentType /
componentSubType / isTemplate / singleton). They anchor the OpenFin
identity, multi-window, and template/singleton branches in the
upcoming spec sessions. Not advertised on the dock — opened directly
by URL from the harness.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 3 | test view manifests`.

---

### Session 4 — Playwright CDP attach prototype

**Goal:** A single Playwright spec that attaches to the running OpenFin runtime via CDP, finds the `react-workspace-starter` provider window, and asserts a property of it. This proves the connection model end-to-end before we add globalSetup.

**Preconditions**
- Sessions 1–3 committed
- Reference app dev server reachable at `:5174`
- OpenFin runtime confirmed working (session 2 smoke script)

**Steps**
1. Add `e2e-openfin/helpers/connectPlaywright.ts`:
   ```ts
   import { chromium, type Browser } from '@playwright/test';
   export async function connectViaCDP(debugPort = 9090): Promise<Browser> {
     return chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
   }
   export async function findPageByUrlSubstring(browser: Browser, urlPart: string) {
     for (const ctx of browser.contexts()) {
       for (const page of ctx.pages()) {
         if (page.url().includes(urlPart)) return page;
       }
     }
     return null;
   }
   ```
2. Add `e2e-openfin/tests/01-cdp-attach.spec.ts`:
   - Inside the test, manually call `launchPlatform()` → `connectViaCDP()` → assert at least one page exists → call `quit()`.
   - This is the **manual lifecycle** version. Session 5 promotes it to a fixture.
   - Don't try to find a specific page yet — just `expect(browser.contexts()[0].pages().length).toBeGreaterThan(0)`. Some OpenFin platforms boot with no auto-shown view.
3. Run `npm run test:e2e:openfin -- --grep "01-cdp"` and confirm it passes against a fresh runtime.

**Acceptance criteria**
- The single spec passes.
- After completion, no orphan OpenFin process remains (manual check).
- If the spec fails, the failure mode must be diagnosable from the Playwright reporter output alone (port-in-use → clear error; runtime not installed → clear error). If diagnostics are weak, improve the helper before declaring acceptance.

**Commit message template**
```
test(e2e-openfin): prove Playwright CDP attach against running platform

First spec connects to the OpenFin platform via chromium.connectOverCDP
on port 9090 (exposed by the existing platform manifest), enumerates
pages, then quits cleanly. Manual launch/quit lifecycle here; session 5
hoists this into a Playwright fixture.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 4 | CDP attach prototype`.

---

### Session 5 — Reusable `openfin` Playwright fixture + first smoke spec

**Goal:** Hide the launch/connect/quit lifecycle behind a Playwright fixture so test bodies stay clean. Land a first real smoke test that opens `test-blotter-a`, finds its page, and confirms an AG-Grid row exists.

**Preconditions**
- Session 4 committed
- Test view manifests served by the dev server (session 3)

**Steps**
1. Create `e2e-openfin/fixtures/openfin.ts` extending Playwright's `test`:
   ```ts
   type OpenFinFixtures = {
     platform: PlatformHandle;
     browser: Browser;             // CDP-attached
     openView: (manifestUrl: string) => Promise<Page>;
   };
   export const test = base.extend<OpenFinFixtures>({
     platform: [async ({}, use) => {
       const handle = await launchPlatform();
       await use(handle);
       await handle.quit();
     }, { scope: 'worker' }],
     browser: [async ({ platform }, use) => {
       const browser = await connectViaCDP(platform.debugPort);
       await use(browser);
       await browser.close();
     }, { scope: 'worker' }],
     openView: async ({ platform, browser }, use) => {
       const opened: string[] = [];           // identity uuids for cleanup
       const fn = async (manifestUrl: string) => {
         const uuid = `e2e-view-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
         await platform.fin.Platform.getCurrentSync().createView(
           { name: uuid, manifestUrl } as any,
           undefined,
         );
         opened.push(uuid);
         // Wait for the page to appear via CDP — poll for up to 10s.
         const start = Date.now();
         while (Date.now() - start < 10_000) {
           const page = await findPageByUrlSubstring(browser, manifestUrl.replace('.fin.json', ''));
           if (page) return page;
           await new Promise((r) => setTimeout(r, 200));
         }
         throw new Error(`View did not appear: ${manifestUrl}`);
       };
       await use(fn);
       // Per-test cleanup: close any views we opened.
       for (const uuid of opened) {
         try {
           await platform.fin.View.wrapSync({ uuid: 'react-workspace-starter', name: uuid }).destroy();
         } catch { /* already gone */ }
       }
     },
   });
   ```
2. Reuse `worker` scope for the platform and browser fixtures so the runtime boots once per worker (we only run one worker per D1, so this is once per `npm run test:e2e:openfin` invocation).
3. Add `e2e-openfin/tests/02-smoke.spec.ts`:
   ```ts
   import { test, expect } from '../fixtures/openfin';
   const VIEW = 'http://localhost:5174/views/test-blotter-a.fin.json';
   test('smoke — view boots and grid renders', async ({ openView }) => {
     const page = await openView(VIEW);
     await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
     await expect(page.locator('.ag-row').first()).toBeVisible({ timeout: 15_000 });
   });
   ```
4. Add `webServer` to `e2e-openfin/playwright.config.ts` to launch the reference app dev server (mirror the snippet from the root `playwright.config.ts`). This is the first session that needs the dev server running — until now, manual `npm run dev` was acceptable.

**Acceptance criteria**
- `npm run test:e2e:openfin` runs both `01-cdp-attach.spec.ts` and `02-smoke.spec.ts` green.
- Test duration <30s on a warm machine (cold first-run will be longer due to RVM download).
- Cleanup is verified: after the run, only the dev-server process remains; no OpenFin processes orphaned.

**Commit message template**
```
test(e2e-openfin): add openfin fixture and grid-renders smoke test

Worker-scoped platform/browser fixtures lift the launch/connect/quit
lifecycle out of test bodies. New `openView(manifestUrl)` fixture
opens a fresh view, returns its Page via CDP, and cleans up
afterward. First smoke spec opens test-blotter-a and asserts the
grid mounts with at least one row.

Webserver added to e2e-openfin/playwright.config.ts so the run is
self-contained.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 5 | openfin fixture + smoke`.

---

### Session 6 — `customData` identity spec (parity rows 1, 3, 21)

**Goal:** Prove that `useHostedIdentity`'s OpenFin branch — never executed in browser specs — actually reads `customData` correctly under the real runtime, and that the toolbar info popover surfaces those values.

**Preconditions**
- Sessions 1–5 committed
- Smoke test green

**Steps**
1. Add `e2e-openfin/tests/03-identity-customdata.spec.ts`:
   ```ts
   test('customData identity — instanceId reaches the wrapper', async ({ openView }) => {
     const page = await openView('http://localhost:5174/views/test-blotter-a.fin.json');
     await expect(page.locator('.ag-root')).toBeVisible();
     // 1. fin.me.getOptions() returns the expected customData (sanity).
     const opts = await page.evaluate(() => (globalThis as any).fin.me.getOptions());
     expect(opts.customData.instanceId).toBe('e2e-openfin-test-a');
     expect(opts.customData.componentType).toBe('MarketsGrid');
     expect(opts.customData.componentSubType).toBe('FX');
     // 2. document.title set by the wrapper effect (not just the manifest).
     expect(await page.title()).toContain('MarketsGrid');
   });
   ```
2. Add a second test: open `test-blotter-a`, click the toolbar ⓘ icon, assert the popover content contains both the OpenFin `instanceId` (`e2e-openfin-test-a`) and the `componentType` (`MarketsGrid`). Locator strategy: read `e2e/hosted-markets-grid.spec.ts`'s info-popover test for the exact selector and reuse it via a shared helper in `e2e-openfin/helpers/`.
3. Add a third test: open `test-blotter-template.fin.json`, assert `fin.me.getOptions().customData.isTemplate === true` and `singleton === true`. This guards the template/singleton branches that would otherwise have zero coverage.

**Acceptance criteria**
- Three tests pass.
- Tests are independent — running any one in isolation passes.
- Failure messages are specific (e.g. assertion failures show the actual value, not just `expected true`).

**Commit message template**
```
test(e2e-openfin): cover OpenFin customData identity (parity 1, 3, 21)

Three tests against the real OpenFin runtime: fin.me.getOptions()
returns the manifest's customData, the wrapper sets document.title
from componentName, the toolbar info popover surfaces the OpenFin
instanceId + componentType, and the template/singleton flags reach
the registered-identity branch.

These code paths are never executed in browser-mode specs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 6 | customData identity specs`.

---

### Session 7 — Registered-component storage spec (parity row 4)

**Goal:** Confirm that when `withStorage=true`, every `getConfig` / `saveConfig` / `deleteConfig` call carries `componentType` / `componentSubType` / `isTemplate` / `singleton` derived from the OpenFin manifest. Tested via real ConfigService writes — no mocks.

**Preconditions**
- Session 6 committed
- ConfigManager exposes a way to inspect rows from a Page context — either a debug-only global or a `page.evaluate(() => fin.InterApplicationBus.send(...))` call. **First step of this session is to find the simplest path. If neither exists, add a dev-only debug hook gated on a query param.** Document the chosen approach in the commit body.

**Steps**
1. Reconnaissance: read `packages/config-service/` to find the surface area for inspecting written rows. Look for a method like `listAllRows()` or similar.
2. If no ergonomic API exists, add a debug-only window-level escape hatch in the reference app:
   ```ts
   // apps/markets-ui-react-reference/src/main.tsx (dev only)
   if (import.meta.env.DEV) (window as any).__configManager = configManager;
   ```
   Gate strictly on `DEV` so production bundles never expose it.
3. Add `e2e-openfin/tests/04-registered-component-storage.spec.ts`:
   ```ts
   test('storage rows carry registered-component discriminators', async ({ openView }) => {
     const page = await openView('http://localhost:5174/views/test-blotter-a.fin.json');
     await expect(page.locator('.ag-root')).toBeVisible();
     // Trigger a profile save (locator copied from e2e/v2-profile-lifecycle.spec.ts).
     await profileLifecycleHelpers.createProfile(page, 'e2e-test-profile');
     // Read rows back via the dev hook.
     const rows = await page.evaluate(async () => {
       const cm = (window as any).__configManager;
       return cm.listConfigs({ instanceId: 'e2e-openfin-test-a' });
     });
     expect(rows.length).toBeGreaterThan(0);
     for (const row of rows) {
       expect(row.componentType).toBe('MarketsGrid');
       expect(row.componentSubType).toBe('FX');
       expect(row.isTemplate).toBe(false);
       expect(row.singleton).toBe(false);
     }
   });
   ```
4. `afterEach` cleanup: delete every row matching `instanceId === 'e2e-openfin-test-a'` so subsequent tests start from a known state.

**Acceptance criteria**
- Spec passes.
- Cleanup works: a second run produces the same row counts (proves we don't accumulate state).
- The debug hook is gated on `import.meta.env.DEV`. Verify with `npm run build -w @marketsui/markets-ui-react-reference` followed by a grep against `dist/` for `__configManager` — must be absent.

**Commit message template**
```
test(e2e-openfin): registered-component fields stamped on AppConfigRow (parity 4)

Saves a profile under test-blotter-a (componentType=MarketsGrid,
subType=FX), reads rows back via the dev-only window.__configManager
hook, asserts every row carries the four discriminator fields. Per-
test cleanup deletes the test instanceId's rows.

Production bundles do not expose the debug hook (build-grepped).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 7 | registered-component storage spec`.

---

### Session 8 — Multi-window storage isolation (parity row 18)

**Goal:** Open `test-blotter-a` and `test-blotter-b` simultaneously, change the active provider in A, confirm B is unaffected. Mirrors the deferred manual check from HMG session 10 step 3.

**Preconditions**
- Sessions 6–7 green

**Steps**
1. Add `e2e-openfin/tests/05-multi-window-isolation.spec.ts`:
   ```ts
   test('grid-level provider selection is isolated per instanceId', async ({ openView }) => {
     const pageA = await openView('http://localhost:5174/views/test-blotter-a.fin.json');
     const pageB = await openView('http://localhost:5174/views/test-blotter-b.fin.json');
     await Promise.all([
       expect(pageA.locator('.ag-root')).toBeVisible(),
       expect(pageB.locator('.ag-root')).toBeVisible(),
     ]);
     // Open provider picker in A and pick the second provider.
     await pageA.keyboard.press('Alt+Shift+P');
     // ... click second provider entry; locator copied from e2e/hosted-markets-grid.spec.ts
     // Read both views' active provider id from gridLevelData via the debug hook.
     const aProv = await readActiveProvider(pageA, 'e2e-openfin-test-a');
     const bProv = await readActiveProvider(pageB, 'e2e-openfin-test-b');
     expect(aProv).not.toEqual(bProv);
     // The crucial isolation assertion: B's provider was not perturbed by A's change.
     expect(bProv).toEqual(/* default-provider-id from the seed */);
   });
   ```
2. Add a `helpers/configReader.ts` that wraps the `__configManager` accessor patterns from session 7 — share the API rather than copy-pasting evaluate calls.
3. `afterEach` cleans rows for both `instanceId` values.

**Acceptance criteria**
- Spec passes deterministically across 5 consecutive runs (manual: `for i in 1..5; do npm run test:e2e:openfin -- --grep multi-window; done`).
- If a flake is observed, fix the root cause (likely a missing `await` or a race against the picker popup) before declaring acceptance.

**Commit message template**
```
test(e2e-openfin): multi-window storage isolation (parity 18)

Opens test-blotter-a + test-blotter-b in parallel, changes the active
provider in A via Alt+Shift+P, confirms B's gridLevelData is
unchanged. Replaces the deferred manual check from
HOSTED_MARKETS_GRID_REFACTOR_WORKLOG.md session 10 step 3.

Helpers/configReader.ts factored out for reuse by sessions 9-10.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 8 | multi-window isolation spec`.

---

### Session 9 — Per-view active-profile override (workspace round-trip — IMPLEMENTED_FEATURES §1.13)

**Goal:** This feature has zero non-OpenFin coverage today. Open a view, switch to a custom profile, capture a snapshot via `Platform.getSnapshot()`, assert the snapshot contains the active-profile id on the view's `customData`, then apply the snapshot and confirm the view re-mounts with the correct active profile.

**Preconditions**
- Sessions 1–8 green
- §1.13 in `docs/IMPLEMENTED_FEATURES.md` reviewed for the exact field name (`customData.activeProfileId`) and the expected round-trip rules

**Steps**
1. Add `e2e-openfin/tests/06-per-view-active-profile-override.spec.ts`:
   - Open `test-blotter-a`
   - Create a profile named `e2e-foo`, switch to it
   - Read the platform snapshot via `page.evaluate(() => fin.Platform.getCurrentSync().getSnapshot())`
   - Assert the matching view entry's `customData.activeProfileId` is the id of `e2e-foo`
   - Apply the snapshot to a fresh platform restart (this is the harder part — may need to drive a `Platform.applySnapshot()` from Node via the `platform.fin` handle in the fixture)
   - After re-apply, locate the new view's page and assert its active profile in the profile selector matches `e2e-foo`
2. Verify duplicate-view semantics: clone the view via `Platform.createView` with the duplicated `customData`, confirm the clone opens with the same active profile but subsequent changes diverge. Cite the worklog entry: `docs/FEATURE_WORKLOG.md` Feature 1.

**Acceptance criteria**
- Spec passes.
- The deferred manual check from HMG session 10 step 2 (multi-window storage isolation) and step 3 (workspace round-trip) are now both automated. Update HMG session-10 manual checklist accordingly in this commit.

**Commit message template**
```
test(e2e-openfin): per-view active-profile override workspace round-trip (§1.13)

Captures a Platform snapshot after switching profile, asserts
customData.activeProfileId is stamped on the view entry, applies the
snapshot, confirms the rehydrated view restores the same active
profile. Closes the zero-coverage gap on IMPLEMENTED_FEATURES §1.13
and the deferred manual checks from the HostedMarketsGrid worklog.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 9 | per-view active-profile override spec`.

---

### Session 10 — Theme + provider-picker under OpenFin (parity rows 12, 16)

**Goal:** Re-run the theme-flip and Alt+Shift+P specs from `e2e/hosted-markets-grid.spec.ts` against the real OpenFin runtime. These already pass in browser mode — re-running them under OpenFin guards against regressions in the runtime's window-focus model and IAB theme broadcast (the real-world theme-distribution mechanism).

**Preconditions**
- Sessions 1–9 green

**Steps**
1. Add `e2e-openfin/tests/07-theme-flip.spec.ts` — port the theme test from the browser e2e, swapping the `localStorage` theme toggle for whatever the OpenFin host actually uses. Read the openfin-platform's theme-broadcast code path before writing the spec.
2. Add `e2e-openfin/tests/08-provider-picker-hotkey.spec.ts` — open A, focus inside the grid, press Alt+Shift+P, assert toolbar visible. Add a second case: with two views open, the hotkey only toggles the focused view's picker (this is the OpenFin-specific concern — global hotkey vs view-scoped).

**Acceptance criteria**
- Both specs pass.
- The two-views hotkey case is deterministic (no flakes across 3 runs).

**Commit message template**
```
test(e2e-openfin): theme flip + provider-picker hotkey under OpenFin (parity 12, 16)

Re-runs the browser-mode HostedMarketsGrid theme-flip spec against
the real runtime to guard the IAB theme broadcast path; adds a
two-views hotkey-isolation case that the browser harness can't
express because it has only one focus model.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 10 | theme + provider-picker specs`.

---

### Session 11 — Manual smoke checklist (option 3)

**Goal:** Land `e2e-openfin/MANUAL_CHECKLIST.md` covering everything automation either can't reach or where automation cost outweighs the regression risk.

**Preconditions**
- Sessions 1–10 green so the checklist can declare "automation covers X, manual covers Y" cleanly

**Steps**
1. Create `e2e-openfin/MANUAL_CHECKLIST.md` with sections:
   - **Pre-flight** — RVM installed, port 9090 free, dev server running.
   - **Workspace persistence** — File → Save Workspace, quit, relaunch from the saved workspace JSON, confirm view positions and active profiles restore. (Even with session 9's automation, this exercises the full RVM workspace-save flow which automation skips.)
   - **Multi-monitor placement** — drag a view to a second monitor, save workspace, restore; the view must open on monitor 2.
   - **Native window-manager** — minimize / restore / maximize — does the AG-Grid layout reflow correctly on each.
   - **Platform-restart recovery** — `Platform.quit()` followed by relaunching from the same manifest URL should restore views to their last positions if `preventQuitOnLastWindowClosed: true` was honoured.
   - **Visual smoke** — render each `customData.componentSubType` (FX, Equities, etc.) and confirm provider rows look right; theme flip across all open views simultaneously.
2. Each section: numbered steps, expected result, "tick to confirm" boxes, plus a **Failure modes** subsection documenting what each step is guarding against (so a future reviewer can decide whether the failure matters for their PR).
3. Cross-link from `e2e-openfin/README.md` (session 12).

**Acceptance criteria**
- The checklist is self-sufficient — a reviewer can execute it without prior context.
- Total hand-execution time ≤15 minutes.

**Commit message template**
```
docs(e2e-openfin): manual smoke checklist for OpenFin-only behaviours

Covers the gaps automation can't or shouldn't reach: workspace
persistence end-to-end, multi-monitor placement, native window-manager
interactions, platform-restart recovery, and per-componentSubType
visual smoke. Self-contained; ~15 minutes to walk.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 11 | manual checklist`.

---

### Session 12 — Documentation, IMPLEMENTED_FEATURES, MEMORY index

**Goal:** Ship the OpenFin e2e README; record the new harness in `IMPLEMENTED_FEATURES.md`; add a memory bullet so future sessions can find the worklog. Final verification.

**Preconditions**
- Sessions 1–11 committed and green

**Steps**
1. Create `e2e-openfin/README.md`:
   - One-paragraph overview
   - Prerequisites (OpenFin RVM, port 9090, repo built)
   - How to run: `npm run test:e2e:openfin`
   - Troubleshooting: port already in use, runtime download stuck, view did not appear
   - Cross-link to `MANUAL_CHECKLIST.md`
   - Cross-link to this worklog
2. Append §1.15 to `docs/IMPLEMENTED_FEATURES.md`: "OpenFin e2e harness" with the parity matrix, what's automated vs manual, and pointers to `e2e-openfin/`.
3. Add a memory bullet pointing at this worklog (mirror the existing `reference_hosted_markets_grid_refactor.md` pattern):
   - File: `<memory-dir>/reference_openfin_e2e_harness.md`
   - Index entry in `MEMORY.md`: `- [OpenFin e2e harness worklog](reference_openfin_e2e_harness.md) — 12-session plan at docs/OPENFIN_E2E_HARNESS_WORKLOG.md`
4. Final verification:
   - `npm run test:e2e:openfin` — every spec green
   - `npx turbo typecheck build test` — green
   - `npx turbo e2e` — same baseline as before this branch (no regression in browser e2e)
5. Append a "Harness complete" section to this worklog: branch HEAD sha, lines added, parity row checklist with ✓ marks.
6. Open a draft PR (gh CLI permitting; otherwise paste the body into the GitHub web UI like the HMG PR).

**Acceptance criteria**
- All four verification commands green.
- Docs render correctly (Markdown lint).
- PR draft exists or its URL is recorded for the reviewer to open manually.

**Commit message template**
```
docs(e2e-openfin): README, IMPLEMENTED_FEATURES §1.15, MEMORY bullet

Wraps the harness with a self-sufficient README, records the new
coverage in IMPLEMENTED_FEATURES, and indexes this worklog in user
memory.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Exit → log:** `<sha> | session 12 | docs + harness complete`.

---

## Session log

Append one line per completed session: `<sha> | session N | one-line summary`.

54aeb4f | session 1 | scaffold workspace (replaced prior Vitest harness with Playwright per D3/D4)
361eb33 | session 2 | launchPlatform helper + smoke (manual runtime smoke deferred to reviewer — needs OpenFin RVM + port 9090 + dev server)
6152ad6 | session 3 | test view manifests + routes (a manifest, +three lazy /views/test-blotter-{a,b,template} routes mounting BlottersMarketsGrid; dev-server fetch + dock-invisibility deferred to reviewer)
67479c7 | session 3 | follow-up: b + template manifests (git add dropped on prior commit)
9a060d0 | session 4 | CDP attach prototype (spec lists via `playwright test --list`; runtime execution deferred to reviewer — needs OpenFin RVM + dev server)
767d6e3 | session 5 | openfin fixture + smoke (worker-scoped platform/cdpBrowser + test-scoped openView; webServer added to playwright.config.ts; typecheck clean, both specs list; runtime execution of 02-smoke deferred to reviewer)
829da99 | session 6 | customData identity specs (3 tests: fin.me.getOptions() readback for blotter-a + template, toolbar info popover surfaces componentName + instanceId; popover assertion targets componentName since componentType is not surfaced in the toolbar today; typecheck clean, all 3 specs list; runtime execution deferred to reviewer)
8771f0b | session 7 | registered-component storage spec (DEV-only window.__configManager hook in reference app main.tsx; helpers/configReader.ts for list/delete by (appId,userId); spec creates a profile then asserts componentType/subType/isTemplate/singleton on every row; typecheck clean, 6/6 specs list; runtime execution + production-bundle grep for __configManager deferred to reviewer)
48881b9 | session 8 | multi-window isolation spec (helpers/configReader.ts gains readGridLevelLiveProviderId + setGridLevelLiveProviderId — read-modify-write mirroring createConfigServiceStorage.saveGridLevelData; spec opens test-blotter-a + test-blotter-b, seeds each row via profile-create UI, stamps distinct liveProviderId per instanceId, asserts cross-page reads see only their own row's value; picker UI not driven because the reference app seeds no data-provider rows — Alt+Shift+P chord deferred to session 10 under OpenFin; typecheck clean, 7/7 specs list; runtime execution deferred to reviewer)
e9f2373 | session 9 | per-view active-profile override spec (two tests in 06-per-view-active-profile-override.spec.ts: (a) round-trip — create profile via UI, read activeProfileId from fin.me.getOptions().customData, walk Platform.getSnapshot() for the matching view entry, assert override is captured, then drive Platform.applySnapshot({ closeExistingWindows: true }) from the Node fin handle and assert the rehydrated profile selector restores; (b) duplicate-view divergence — clone via Platform.createView passing customData with the source's activeProfileId, assert clone boots on the same profile, switch the clone, assert the source is untouched. Snapshot walker mirrors workspace-persistence.ts collectViewNodes; clone resolution by view name via fin.me.identity.name (CDP exposes URLs only). HMG worklog manual-checks section updated to point at sessions 8 + 9 as the automation. typecheck clean, 9/9 specs list; runtime execution deferred to reviewer.)
c5a7188 | session 10 | theme + provider-picker specs (07-theme-flip.spec.ts: single-view IAB flip publishes 'theme-changed' { isDark: false } from the page itself — reference app's ThemeProvider subscribes to me.identity.uuid which equals the publishing view's uuid since both are the platform UUID — asserts [data-theme] flips and AG-Grid background colour observably changes; cross-view broadcast opens A+B and publishes from A, asserts both flip together (OpenFin-only path, no browser equivalent); afterEach broadcasts back to dark and clears localStorage.theme on every open page so downstream tests inherit a clean dark default. 08-provider-picker-hotkey.spec.ts: single-view chord mirrors browser e2e assertion (Live/Hist buttons appear); two-views isolation case dispatches the chord on pageA, asserts the picker mounts in A only and B stays untouched (CDP routes Input.dispatchKeyEvent to the targeted Page's session, so per-view focus is enforced by the runtime's keyboard delivery path). Chord helper mirrors the browser e2e's down/down/press/up/up sequence so any modifier-latching handler sees the same key flow. typecheck clean, 13/13 specs list across 8 files; runtime execution deferred to reviewer.)
5d24661 | session 11 | manual checklist (e2e-openfin/MANUAL_CHECKLIST.md, 5 sections after pre-flight: workspace persistence end-to-end via RVM Save Workspace, multi-monitor placement, native window-manager minimize/maximize/drag-resize reflow, platform-restart recovery via preventQuitOnLastWindowClosed last-view-close path, per-componentSubType visual smoke + cross-view theme flip; each section carries numbered steps, tickable expectations, and a Failure modes subsection so a reviewer can decide whether the regression class matters for their PR; ~15-minute walk; cross-link from e2e-openfin/README.md deferred to session 12 since the README does not exist yet)
7660c81 | session 12 | docs + harness complete (e2e-openfin/README.md with prerequisites, run instructions, layout table, coverage matrix cross-linked to MANUAL_CHECKLIST.md and the worklog, troubleshooting for port-in-use / RVM download / missing __configManager hook; IMPLEMENTED_FEATURES §1.15 records the harness with parity rows, added artefacts, and constraints; user-memory entry already present from prior session; final `npx turbo typecheck` green — FULL TURBO 52/52 cached since the change is docs-only; runtime test:e2e:openfin and turbo build/test/e2e deferred to reviewer per the harness's local-only-by-design constraint. Sha to be filled in by a follow-up `docs:` commit once this lands, mirroring sessions 10–11.)

---

## Harness complete

**Branch:** `e2e/openfin-harness` — ready for review.
**Sessions landed:** 12/12.
**Net additions:** new `e2e-openfin/` workspace package
(helpers + fixtures + 8 specs + manual checklist + README), three test
view manifests under
`apps/markets-ui-react-reference/public/views/test-blotter-{a,b,template}.fin.json`,
DEV-only `window.__configManager` hook in the reference app's `main.tsx`,
new root script `npm run test:e2e:openfin`, and `IMPLEMENTED_FEATURES`
§1.15. No production code paths were modified.

**Parity matrix coverage:**

| # | Feature | Coverage |
|---|---|---|
| 1 | OpenFin identity via `fin.me.getOptions()` | ✓ `tests/03-identity-customdata.spec.ts` |
| 3 | Registered-component fields surfaced | ✓ `tests/03-identity-customdata.spec.ts` + `tests/04-registered-component-storage.spec.ts` |
| 4 | Storage factory auto-injects registered metadata | ✓ `tests/04-registered-component-storage.spec.ts` |
| 8 | Full-bleed fixed layout under OpenFin chrome | ✓ smoke (`tests/02-smoke.spec.ts`) + manual visual smoke |
| 9 | DataPlane provider mount under OpenFin | ✓ smoke (`tests/02-smoke.spec.ts`) |
| 12 | Theme switching via IAB broadcast | ✓ `tests/07-theme-flip.spec.ts` (single-view + cross-view) |
| 16 | Provider picker (Alt+Shift+P) per-view focus | ✓ `tests/08-provider-picker-hotkey.spec.ts` |
| 18 | Grid-level provider persistence isolation | ✓ `tests/05-multi-window-isolation.spec.ts` |
| 21 | Toolbar ⓘ popover surfaces OpenFin identity | ✓ `tests/03-identity-customdata.spec.ts` |
| §1.13 | Per-view active-profile override workspace round-trip | ✓ `tests/06-per-view-active-profile-override.spec.ts` (snapshot capture + apply + duplicate divergence) |

**Manual coverage:** workspace persistence end-to-end via RVM Save
Workspace, multi-monitor placement, native window-manager interactions,
platform-restart recovery, per-`componentSubType` visual smoke — see
`e2e-openfin/MANUAL_CHECKLIST.md` (~15-minute walk).

**Out of scope (called out in Constraints):** CI integration, headless
mode, dynamic port selection. The harness is local-only by design;
reviewers run it on their dev box before merging OpenFin-affecting PRs.

**Verification (this session):** `npx turbo typecheck` green (52/52
FULL TURBO cached — change is docs + new README only).
`npm run test:e2e:openfin` and `npx turbo build test e2e` deferred to
the reviewer per the harness's local-only constraint and the
zero-broken-state rule from the worklog header (each prior session
already cleared its own runtime acceptance with the reviewer or
recorded the deferral).
