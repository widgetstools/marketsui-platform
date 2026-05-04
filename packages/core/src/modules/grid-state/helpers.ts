/**
 * Pure helpers — capture/apply grid state against a live GridApi.
 *
 * Extracted from `agGridStateManager.ts` and kept framework-free so they can
 * be imported by the module's lifecycle hooks AND by the host (for the
 * "capture on explicit Save" wiring in MarketsGrid).
 */
import type { GridApi } from 'ag-grid-community';
import type { Store } from '../../platform/types';
import {
  GRID_STATE_SCHEMA_VERSION,
  type GridStateState,
  type SavedGridState,
} from './state';

/**
 * Read the current grid state off a live api. Safe to call any time after
 * `onGridReady`. Never throws — on API shape drift returns a minimal
 * snapshot with empty gridState so the caller can still persist *something*.
 */
export function captureGridState(api: GridApi): SavedGridState {
  const gridState = (() => {
    try {
      // Sanitise on the way OUT too — a transient malformed set
      // model that AG-Grid hands back from `getState()` during init
      // shouldn't poison the next snapshot we persist. Existing bad
      // snapshots heal on the next save once they pass through here.
      return sanitiseFilterModelInState(api.getState());
    } catch {
      return {} as ReturnType<GridApi['getState']>;
    }
  })();

  // Viewport anchor — persisted so the user returns to the row + column they
  // were looking at. Persisting a colId rather than raw pixels survives
  // column resize/reorder; we keep the raw pixel as a fallback.
  let firstRowIndex = 0;
  let leftColId: string | null = null;
  let horizontalPixel = 0;
  try {
    firstRowIndex = api.getFirstDisplayedRowIndex();
    const hRange = api.getHorizontalPixelRange?.();
    if (hRange) {
      horizontalPixel = hRange.left;
      const displayed = api.getAllDisplayedColumns();
      const hit = displayed.find((c) => {
        const left = c.getLeft();
        return left != null && left + c.getActualWidth() > hRange.left;
      });
      leftColId = hit?.getColId() ?? null;
    }
  } catch {
    /* best-effort — leave anchor at defaults */
  }

  let quickFilter: string | undefined;
  try {
    const q = api.getGridOption('quickFilterText');
    if (q) quickFilter = q;
  } catch {
    /* ignore */
  }

  return {
    schemaVersion: GRID_STATE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    gridState,
    viewportAnchor: { firstRowIndex, leftColId, horizontalPixel },
    quickFilter,
  };
}

/**
 * Apply a previously-captured snapshot to a live grid. `api.setState()`
 * handles columns/filters/sort/pagination/selection etc. natively; the
 * viewport anchor and quick-filter are replayed separately.
 */
export function applyGridState(api: GridApi, saved: SavedGridState): void {
  if (!api || !saved) return;
  if (saved.schemaVersion !== GRID_STATE_SCHEMA_VERSION) {
    console.warn(
      `[grid-state] schema mismatch (saved=${saved.schemaVersion}, ` +
        `current=${GRID_STATE_SCHEMA_VERSION}); attempting best-effort restore.`,
    );
  }

  try {
    // Sanitise filter models before restoring — see
    // `sanitiseFilterModel` for why a malformed set-filter shape in
    // a persisted snapshot crashes AG-Grid 35.2.x's
    // `SetFilterHandler.refresh()` with `model.values is not
    // iterable` on reload.
    const sanitisedGridState = sanitiseFilterModelInState(saved.gridState);
    api.setState(sanitisedGridState);
  } catch (err) {
    console.warn('[grid-state] api.setState failed:', err);
  }

  // Explicit column-state restore — AG-Grid's `setState` silently drops
  // both the position AND the pinning of the auto-generated selection
  // column (colId `ag-Grid-SelectionColumn`). Saving a layout with the
  // checkbox column pinned to the far left, reloading, then watching it
  // snap back to the center zone is the symptom that led us here.
  //
  // Re-issue order + pinning via `applyColumnState` — that's the API
  // the docs recommend for programmatic column-state updates, and it
  // does correctly reorder / repin the selection column. Build each
  // entry from the three saved slices (columnOrder + columnPinning),
  // so passing `{ colId }` alone doesn't inadvertently reset pinning
  // to null.
  //
  // IMPORTANT — must run AFTER the grid's initial layout settles.
  // Calling inside `onGridReady` (synchronously with setState) is a
  // no-op for the selection column because AG-Grid hasn't finished
  // injecting + positioning auto-generated columns yet. Defer to the
  // next microtask AND bind a one-shot `firstDataRendered` listener as
  // a fallback for the "rows arrive later" cold-mount case.
  const orderedColIds = (saved.gridState as { columnOrder?: { orderedColIds?: string[] } })
    .columnOrder?.orderedColIds;
  const pinning = (saved.gridState as {
    columnPinning?: { leftColIds?: string[]; rightColIds?: string[] };
  }).columnPinning;
  // Build a colId → width map from the saved columnSizingModel. When we
  // re-issue applyColumnState for order + pinning, we pass the saved width
  // along with each entry. Without it, downstream columnDefs re-derivations
  // (driven by `maintainColumnOrder` → React re-render → AG-Grid reconciling
  // new prop references) can reset virtual columns back to their
  // `initialWidth`, silently clobbering the user's resize. Passing width
  // explicitly makes the restore idempotent.
  const sizingModel = (saved.gridState as {
    columnSizing?: { columnSizingModel?: Array<{ colId: string; width: number; flex?: number }> };
  }).columnSizing?.columnSizingModel;
  const savedWidth = new Map<string, number>();
  const savedFlex = new Map<string, number>();
  if (Array.isArray(sizingModel)) {
    for (const entry of sizingModel) {
      if (typeof entry.colId === 'string' && typeof entry.width === 'number') {
        savedWidth.set(entry.colId, entry.width);
      }
      if (typeof entry.colId === 'string' && typeof entry.flex === 'number') {
        savedFlex.set(entry.colId, entry.flex);
      }
    }
  }
  if (Array.isArray(orderedColIds) && orderedColIds.length > 0) {
    const leftPinned = new Set(pinning?.leftColIds ?? []);
    const rightPinned = new Set(pinning?.rightColIds ?? []);
    const reorder = () => {
      try {
        // Merge the saved column order with the grid's current column set
        // so columns that exist at reload time but weren't present when
        // the snapshot was captured (e.g. a newly-added calculated
        // column) still render. Without this, `applyColumnState` with
        // only the saved IDs effectively hides those new columns — the
        // user sees an empty column slot or no column at all.
        //
        // Resolution rule: preserve the saved order first, then append
        // any live column id not in the saved list in the order AG-Grid
        // currently has them.
        const saved = new Set(orderedColIds);
        const liveIds = api
          .getColumns?.()
          ?.map((c) => c.getColId())
          ?? [];
        const merged: string[] = [...orderedColIds];
        for (const id of liveIds) {
          if (!saved.has(id)) merged.push(id);
        }
        const nextState = merged.map((colId) => {
          const entry: {
            colId: string;
            pinned: 'left' | 'right' | null;
            width?: number;
            flex?: number;
          } = {
            colId,
            pinned: leftPinned.has(colId)
              ? 'left'
              : rightPinned.has(colId)
                ? 'right'
                : null,
          };
          // Re-assert the saved width/flex alongside order+pinning. AG-Grid's
          // `applyColumnState` treats unspecified properties as unchanged,
          // but a subsequent React-driven columnDefs re-derivation CAN
          // still reset them back to `initialWidth` for virtual columns —
          // passing width here keeps the saved value pinned down.
          const w = savedWidth.get(colId);
          if (typeof w === 'number') entry.width = w;
          const f = savedFlex.get(colId);
          if (typeof f === 'number') entry.flex = f;
          return entry;
        });
        api.applyColumnState({ state: nextState, applyOrder: true });
      } catch (err) {
        console.warn('[grid-state] applyColumnState restore failed:', err);
      }
    };
    // First attempt on the next microtask — covers the common case
    // where the grid's first render has already settled by the time
    // `applyGridState` is called (profile:loaded after grid:ready).
    queueMicrotask(reorder);
    // Second attempt on `firstDataRendered` — covers cold-mount where
    // row data arrives after applyGridState. One-shot listener so we
    // don't re-apply every time new data is paged in.
    try {
      const onFDR = () => {
        reorder();
        try {
          api.removeEventListener('firstDataRendered', onFDR);
        } catch {
          /* ignore */
        }
      };
      api.addEventListener('firstDataRendered', onFDR);
    } catch {
      /* ignore — non-blocking */
    }
  }

  if (saved.quickFilter !== undefined) {
    try {
      api.setGridOption('quickFilterText', saved.quickFilter);
    } catch {
      /* ignore */
    }
  }

  // Viewport — wait for rows to render so ensureIndexVisible has something
  // to scroll to.
  const restoreViewport = () => {
    try {
      const { firstRowIndex, leftColId, horizontalPixel } = saved.viewportAnchor;
      if (firstRowIndex >= 0 && firstRowIndex < api.getDisplayedRowCount()) {
        api.ensureIndexVisible(firstRowIndex, 'top');
      }
      if (leftColId && api.getColumn(leftColId)) {
        api.ensureColumnVisible(leftColId, 'start');
      } else if (horizontalPixel > 0) {
        const body = document.querySelector<HTMLElement>('.ag-body-viewport');
        if (body) body.scrollLeft = horizontalPixel;
      }
    } catch {
      /* best-effort */
    }
  };

  try {
    if (api.getDisplayedRowCount() > 0) {
      queueMicrotask(restoreViewport);
    } else {
      const handler = () => {
        restoreViewport();
        try {
          api.removeEventListener('firstDataRendered', handler);
        } catch {
          /* ignore */
        }
      };
      api.addEventListener('firstDataRendered', handler);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Host-facing helper. Captures the current grid state and writes it into the
 * grid-state module slice on the store. Called by MarketsGrid's Save button
 * handler immediately before `profiles.saveActiveProfile()` — the subsequent
 * `core.serializeAll()` that runs inside `persistSnapshot` then picks up the
 * just-captured state and persists it alongside every other module's state.
 */
export function captureGridStateInto(store: Store, api: GridApi): void {
  const saved = captureGridState(api);
  store.setModuleState<GridStateState>('grid-state', () => ({ saved }));
}

// ─── Filter-model sanitisation ─────────────────────────────────────────────
//
// AG-Grid 35.2.x's `SetFilterHandler.validateModel` iterates
// `model.values` unconditionally. A persisted snapshot containing a
// partial set-filter shape — `{ filterType: 'set' }` (no `values`) or
// `{ filterType: 'set', values: null }` — crashes the grid on reload
// with `TypeError: model.values is not iterable`. The grid is
// unrecoverable from this state until the bad snapshot is dropped.
//
// We can't change AG-Grid's validation, but we can scrub the snapshot
// on both ends of the persistence boundary:
//   - `applyGridState`: filter the saved model before
//     `api.setState(...)` so old bad snapshots don't crash on reload.
//   - `captureGridState`: filter what AG-Grid hands back so a
//     transient bad shape doesn't get persisted into the next save.
// Together, this makes existing bad snapshots self-heal: load → sanitise
// → save → snapshot is now clean.
//
// We never invent values; if a set child looks broken we drop it
// entirely. AG-Grid treats a missing slot in a multi-filter exactly
// the same as the user not having selected anything yet, which is
// the truthful state when the persisted shape was malformed in the
// first place.

interface FilterModelMap {
  [colId: string]: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Returns true when the given filter model is a usable set-filter
 *  shape — has `values` and `values` is an array. */
function isValidSetFilterModel(m: unknown): boolean {
  if (!isPlainObject(m)) return false;
  // We don't insist on `filterType: 'set'` — AG-Grid sometimes emits
  // models without a discriminator and infers from context. Array
  // `values` is the only field validateModel actually iterates, so
  // that's what we gate on.
  return Array.isArray(m.values);
}

/** Sanitise a single per-column filter model. Returns `undefined` if
 *  the model is unsalvageable so the caller can drop the entry. */
function sanitiseColumnFilterModel(model: unknown): unknown | undefined {
  if (!isPlainObject(model)) return undefined;

  // Multi-column filter — recurse into each child slot.
  if (model.filterType === 'multi' && Array.isArray(model.filterModels)) {
    const cleanedChildren = model.filterModels.map((child) => {
      if (child == null) return null;
      // Drop set children with non-iterable values, otherwise pass
      // through unchanged.
      if (isPlainObject(child) && child.filterType === 'set') {
        return isValidSetFilterModel(child) ? child : null;
      }
      // Other child types (text/number/date) don't have the iterable-
      // values contract; pass through.
      return child;
    });
    // If every child cleaned out to null the multi-filter is empty —
    // signal "drop this entry" so the column has no filter applied.
    if (cleanedChildren.every((c) => c == null)) return undefined;
    return { ...model, filterModels: cleanedChildren };
  }

  // Bare set filter at the column root.
  if (model.filterType === 'set') {
    return isValidSetFilterModel(model) ? model : undefined;
  }

  return model;
}

/**
 * Walk a `filterModel` map (colId → model), sanitising each entry
 * and dropping unsalvageable ones. Returns a fresh object — never
 * mutates the input.
 *
 * Public export so other surfaces that push filter models into AG-
 * Grid can apply the same protection. The two known callers are:
 *   - `applyGridState` in this file (load path for the grid-state
 *     module).
 *   - `<FiltersToolbar>` in markets-grid (load path for saved-filter
 *     pill data — runs in a separate React effect that calls
 *     `api.setFilterModel(...)` outside grid-state).
 *
 * Both call sites bring their own bad-snapshot risk; both must
 * sanitise before calling AG-Grid's setter.
 */
export function sanitiseFilterModelMap(filterModel: FilterModelMap): FilterModelMap {
  const out: FilterModelMap = {};
  for (const [colId, model] of Object.entries(filterModel)) {
    const cleaned = sanitiseColumnFilterModel(model);
    if (cleaned !== undefined) out[colId] = cleaned;
  }
  return out;
}

/** Walk `gridState.filter.filterModel` (AG-Grid 35's state shape),
 *  sanitise it, and return a fresh `gridState` object. Returns the
 *  input untouched when there's no filter section.
 *
 *  Typed as a generic over `unknown` so callers can pass either the
 *  AG-Grid native `GridState` (which is a structured type, not an
 *  index-signature `Record<string, unknown>`) or a hand-rolled
 *  object. We do a defensive runtime narrowing inside. */
function sanitiseFilterModelInState<T>(state: T | undefined | null): T {
  if (!state || typeof state !== 'object') return (state ?? ({} as T)) as T;
  const stateRecord = state as unknown as Record<string, unknown>;
  const filterSection = stateRecord.filter as { filterModel?: FilterModelMap } | undefined;
  if (!filterSection || !isPlainObject(filterSection.filterModel)) return state;
  const cleanedModel = sanitiseFilterModelMap(filterSection.filterModel);
  return {
    ...stateRecord,
    filter: { ...filterSection, filterModel: cleanedModel },
  } as unknown as T;
}

/** Test-visible exports. Not part of the public module API; used by
 *  the unit tests to exercise the sanitisation logic without driving
 *  a live AG-Grid through a full apply/capture round trip. */
export const __sanitiseFilterModelForTests = {
  isValidSetFilterModel,
  sanitiseColumnFilterModel,
  sanitiseFilterModelMap,
  sanitiseFilterModelInState,
};
