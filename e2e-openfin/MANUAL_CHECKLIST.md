# OpenFin manual smoke checklist

Use this checklist on any PR that touches the OpenFin layer
(`packages/openfin-platform*`, `apps/markets-ui-react-reference/public/platform/`,
`apps/markets-ui-react-reference/public/views/`, anything under `e2e-openfin/`,
or the `useHostedIdentity` / registered-component-storage paths in
`packages/core` and `packages/widgets-react`).

The Playwright suite under `e2e-openfin/` covers the deterministic OpenFin
code paths (customData identity, registered-component storage discriminators,
multi-window isolation, per-view active-profile override workspace
round-trip, IAB theme broadcast, hotkey routing). This checklist covers
what automation either **can't reach** (multi-monitor placement, native
window-manager interactions, the RVM-driven workspace-save flow) or where
**automation cost outweighs the regression risk** (visual smoke per
componentSubType).

Total walk time: **~15 minutes** on a warm dev box. Do not skip a section
because automation "should have caught it" — every section here exists
because automation cannot.

---

## Pre-flight (≈2 min)

- [ ] **OpenFin RVM installed.** `Get-Command OpenFinRVM.exe` returns a path.
      If not, install from <https://install.openfin.co/download/>.
- [ ] **Port 9090 free.** `netstat -ano | findstr :9090` returns nothing.
      If a stale runtime holds it, `taskkill /F /IM OpenFin.exe` and retry.
      The harness fails fast on a held port — see Constraints in
      [`docs/OPENFIN_E2E_HARNESS_WORKLOG.md`](../docs/OPENFIN_E2E_HARNESS_WORKLOG.md).
- [ ] **Repo built.** `npm ci --legacy-peer-deps && npm run build` succeeded.
- [ ] **Dev server reachable.** In a terminal:
      `npm run dev -w @marketsui/markets-ui-react-reference`. Wait for
      `Local: http://localhost:5174/`. Leave it running for the rest of
      the checklist.
- [ ] **Platform launchable.** In a second terminal:
      `node apps/markets-ui-react-reference/launch.mjs`. The platform
      window opens with the dock visible. Leave it running.

**Failure modes guarded:** RVM uninstall after a Windows reset; port
collision after a previous interrupted run; stale `dist/` from a feature
branch that didn't rebuild; reference app dev server not picking up new
view manifests.

---

## 1. Workspace persistence end-to-end (≈3 min)

Even with session 9's automated `Platform.getSnapshot()` round-trip, this
exercises the full RVM-driven workspace-save flow that automation skips —
the user-facing `Save Workspace` menu writes a file the RVM then reads
on relaunch, and that read path is not reachable via the node-adapter.

1. From the dock, open **two** views: one BlottersMarketsGrid (the default
   dock entry) and one MasterAggBlotter if the dock exposes it. Otherwise
   open the same view twice.
2. In view 1, create a profile named `manual-smoke-1` and switch to it.
3. In view 2, leave the active profile as the default.
4. Drag view 2 ~200px to the right of view 1 so positions are clearly
   distinct.
5. From the dock menu (or `Ctrl+Shift+S` if bound), **Save Workspace** as
   `manual-smoke-workspace`.
6. Quit the platform: dock menu → **Quit**, or `Platform.quit()` from
   DevTools.
7. Confirm no orphan process: `tasklist | findstr OpenFin` is empty.
8. Relaunch from the saved workspace: dock launcher → **Workspaces** →
   `manual-smoke-workspace`. (If the launcher does not show saved
   workspaces, run `node apps/markets-ui-react-reference/launch.mjs
   --workspace=manual-smoke-workspace` per the reference app's CLI.)

**Expected:**
- [ ] Both views reopen at the saved positions (within ~10px tolerance —
      window managers nudge).
- [ ] View 1's active profile is `manual-smoke-1`. View 2's active
      profile is the default.
- [ ] AG-Grid renders rows in both within 5s of view mount.

**Cleanup:** delete the `manual-smoke-1` profile from view 1; delete the
`manual-smoke-workspace` entry from the dock.

**Failure modes guarded:** RVM-side workspace-JSON schema drift (the
node-adapter writes a different shape than the dock's Save Workspace);
profile rehydration timing race when many views restore at once; the
`preventQuitOnLastWindowClosed` honouring on the manifest.

---

## 2. Multi-monitor placement (≈2 min, **skip if single-monitor**)

Automation runs against a single virtual display; multi-monitor coordinate
math is handled entirely by the RVM and the OS window manager and cannot
be exercised any other way.

1. With the platform running, drag a view onto a **second physical
   monitor**.
2. Save workspace as `manual-smoke-multimon`.
3. Quit platform, relaunch from `manual-smoke-multimon`.

**Expected:**
- [ ] The view reopens on monitor 2, not on the primary monitor.
- [ ] Window chrome (title bar, drop-shadow) renders correctly under
      monitor 2's DPI scale (no fuzzy fonts, no clipped chrome).
- [ ] AG-Grid column widths match what was visible before the save.

**Cleanup:** delete `manual-smoke-multimon`.

**Failure modes guarded:** RVM coordinate-space confusion when the
secondary monitor has different DPI; per-monitor DPI awareness flag in
the manifest being dropped on a refactor; AG-Grid measuring against
window-DPI vs view-DPI on first paint.

---

## 3. Native window-manager interactions (≈3 min)

Playwright drives CDP, which has no concept of "minimize/maximize/restore"
in the OS sense. The reflow paths under those transitions only run in
front of a real window manager.

1. Open one view, wait for AG-Grid rows.
2. Click the title bar **minimize** button.
3. Restore the view from the taskbar.
4. Click the title bar **maximize** button.
5. Restore (un-maximize).
6. Manually drag-resize the window: shrink it horizontally to ~400px,
   then expand to full screen.

**Expected after each step:**
- [ ] Step 3 (restore from minimize): grid columns render at the same
      widths as before minimize; no blank canvas; toolbar visible.
- [ ] Step 4 (maximize): grid expands to fill the new viewport; column
      widths either preserve or stretch per the configured `domLayout`;
      no horizontal scrollbar appears unexpectedly.
- [ ] Step 5 (un-maximize): grid returns to pre-maximize size and column
      widths.
- [ ] Step 6 (drag-resize): the toolbar's responsive collapse threshold
      kicks in below ~600px wide and overflow items move into the
      kebab menu; expanding back restores them. No layout flicker.

**Failure modes guarded:** AG-Grid `sizeColumnsToFit` debouncing during
rapid resize; `ResizeObserver` not firing after minimize→restore on
some Windows builds; OpenFin view container reporting stale dimensions
to React for one render after maximize.

---

## 4. Platform-restart recovery (≈2 min)

Distinct from §1 because this exercises the platform-quit-without-save
path that the manifest's `preventQuitOnLastWindowClosed` and
`autoShow: false` settings interact with.

1. Open two views. Do **not** save the workspace.
2. Drag them to non-default positions.
3. Trigger a platform quit via the **last-view close** path: close every
   view by clicking the X on each window. The platform process should
   linger if `preventQuitOnLastWindowClosed: true` is honoured.
4. Re-open a view from the dock.

**Expected:**
- [ ] After step 3, the dock remains visible (platform process did not
      exit).
- [ ] After step 4, the new view opens at the manifest's default
      position, not at one of the previously-dragged positions —
      transient window positions are not persisted, only saved
      workspaces are.
- [ ] `tasklist | findstr OpenFin` between steps 3 and 4 shows the
      platform process still alive.

**Failure modes guarded:** the `preventQuitOnLastWindowClosed` flag
being silently dropped when the platform manifest schema is regenerated;
last-view-close racing the dock teardown and killing the platform
process anyway.

---

## 5. Visual smoke per componentSubType + theme (≈3 min)

Snapshot tests would catch pixel diffs but are flaky against the
real GPU pipeline; this is faster as a human-in-the-loop check.

1. Open one view per `componentSubType` exposed on the dock — at minimum
   FX and Equities. Stagger them so each is visible simultaneously.
2. For each view, confirm:
   - [ ] Provider rows look right (correct columns for that subType, no
         "undefined" or empty cells in the visible viewport).
   - [ ] Toolbar ⓘ popover surfaces the expected `componentName` and
         `instanceId` (matches the dock entry's labelling).
   - [ ] The "Live"/"Hist" provider chips reflect the seeded providers
         for that subType.
3. Theme flip across all open views simultaneously: trigger the theme
   toggle (whichever way the reference app exposes it — typically
   dock menu → Theme, or `Ctrl+Shift+T` if bound).

**Expected:**
- [ ] Every open view flips theme **within the same animation frame** —
      no view lags behind. If one view is still dark while others have
      flipped to light (or vice versa) for more than ~200ms, the IAB
      theme broadcast is racing per-view subscription mount.
- [ ] No coloured surface remains on a hardcoded hex (look specifically
      at toolbar borders, popover backgrounds, AG-Grid header cells —
      these are common drift sites for `--bn-*` token bypass).
- [ ] Flip back to dark; same expectation.

**Failure modes guarded:** a new component shipping with hardcoded
colours that pass the browser e2e (which only checks `[data-theme]`
attribute, not pixel rendering); IAB theme channel name drifting between
publisher and subscriber after a refactor; per-view theme subscription
unmount-leak that only shows when many views are open.

---

## Sign-off

- [ ] All sections above completed without an unchecked expectation.
- [ ] Any failures filed as separate issues with this PR's number
      referenced.
- [ ] Reviewer name + date noted on the PR thread:
      `Manual checklist: <name>, <YYYY-MM-DD>`.

If a section is intentionally skipped (e.g. single-monitor dev box),
state which and why on the PR thread — do not silently drop coverage.
