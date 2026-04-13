/**
 * agGridStateManager.ts
 * ---------------------------------------------------------------------------
 * Framework-agnostic save/load for AG-Grid v34+ (verified against v35.2.1).
 *
 * Captures and restores complete grid state for the Client-Side Row Model:
 *   - Columns: order, visibility, width, pinning, sort, rowGroup, pivot, agg
 *   - Filters (standard + advanced)
 *   - Column groups (open/closed)
 *   - Row group expansion
 *   - Pagination
 *   - Side bar
 *   - Focused cell
 *   - Row selection (CSRM)
 *   - Quick filter
 *   - Viewport anchor: top row index + leftmost visible column at save time
 *
 * REQUIRED MODULES (v33+ enforces module registration):
 *   import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
 *   import { GridStateModule } from 'ag-grid-community';
 *   ModuleRegistry.registerModules([ClientSideRowModelModule, GridStateModule]);
 *
 * Without GridStateModule, getState()/setState()/initialState are no-ops.
 * ---------------------------------------------------------------------------
 */

import type { GridApi, GridState } from 'ag-grid-community';

const SCHEMA_VERSION = 3;

export interface SavedGridState {
  schemaVersion: number;
  savedAt: string;
  /** Native AG-Grid state — covers nearly everything via getState()/setState(). */
  gridState: GridState;
  /** Explicit save-time top row + leftmost visible column. */
  viewportAnchor: {
    firstRowIndex: number;
    leftColId: string | null;
    horizontalPixel: number;
  };
  /** Quick filter is not part of GridState. */
  quickFilter?: string;
}

export interface StorageAdapter {
  save(key: string, state: SavedGridState): void;
  load(key: string): SavedGridState | null;
  clear(key: string): void;
}

/* ========================================================================== */
/*                                   SAVE                                     */
/* ========================================================================== */

/**
 * Capture the complete state of an AG-Grid instance.
 * Safe to call at any time after the grid is ready.
 */
export function captureGridState(api: GridApi): SavedGridState {
  if (!api) {
    throw new Error('captureGridState: GridApi is required');
  }

  // Native state — handles columns, sort, filter, rowGroup, pivot,
  // aggregation, sizing, visibility, pinning, order, columnGroup,
  // rowGroupExpansion, pagination, focusedCell, sideBar, and rowSelection.
  const gridState: GridState = api.getState();

  // Viewport anchor — captured explicitly so we can restore the exact
  // top row and leftmost column the user was looking at.
  const hRange = api.getHorizontalPixelRange?.();
  const firstRowIndex = api.getFirstDisplayedRowIndex();

  let leftColId: string | null = null;
  if (hRange) {
    // Find the first column whose right edge is past the viewport's left scroll.
    // Persisting a colId rather than raw pixels survives column resize/reorder.
    const displayed = api.getAllDisplayedColumns();
    const hit = displayed.find((c) => {
      const left = c.getLeft();
      return left != null && left + c.getActualWidth() > hRange.left;
    });
    leftColId = hit?.getColId() ?? null;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    gridState,
    viewportAnchor: {
      firstRowIndex,
      leftColId,
      horizontalPixel: hRange?.left ?? 0,
    },
    quickFilter: api.getGridOption('quickFilterText') || undefined,
  };
}

/* ========================================================================== */
/*                                   LOAD                                     */
/* ========================================================================== */

/**
 * Extract the GridState slice for use as `initialState` in GridOptions.
 * This is the cleanest restore path — pass at grid construction time.
 */
export function getInitialStateFor(
  saved: SavedGridState | null
): GridState | undefined {
  return saved?.gridState;
}

/**
 * Hot-restore state on an already-mounted grid.
 * Prefer `getInitialStateFor()` + `initialState` GridOption when possible.
 */
export function applyGridState(api: GridApi, saved: SavedGridState): void {
  if (!api || !saved) return;

  if (saved.schemaVersion !== SCHEMA_VERSION) {
    console.warn(
      `[agGridStateManager] schema mismatch ` +
        `(saved=${saved.schemaVersion}, current=${SCHEMA_VERSION}); ` +
        `attempting best-effort restore.`
    );
  }

  // 1. Native restore — handles columns, filters, sort, rowGroup, pivot,
  //    aggregation, sizing, visibility, pinning, order, columnGroup,
  //    rowGroupExpansion, pagination, focusedCell, sideBar, AND selection (CSRM).
  api.setState(saved.gridState);

  // 2. Quick filter — not part of GridState
  if (saved.quickFilter !== undefined) {
    api.setGridOption('quickFilterText', saved.quickFilter);
  }

  // 3. Viewport anchor — defer until rows are present so ensureIndexVisible works
  const restoreViewport = () => {
    const { firstRowIndex, leftColId, horizontalPixel } = saved.viewportAnchor;

    // Vertical: restore top row
    if (firstRowIndex >= 0 && firstRowIndex < api.getDisplayedRowCount()) {
      api.ensureIndexVisible(firstRowIndex, 'top');
    }

    // Horizontal: prefer column id (survives resize/reorder),
    // fall back to raw pixel scroll if that column was removed.
    if (leftColId && api.getColumn(leftColId)) {
      api.ensureColumnVisible(leftColId, 'start');
    } else if (horizontalPixel > 0) {
      const body = document.querySelector<HTMLElement>('.ag-body-viewport');
      if (body) body.scrollLeft = horizontalPixel;
    }
  };

  if (api.getDisplayedRowCount() > 0) {
    queueMicrotask(restoreViewport);
  } else {
    const handler = () => {
      restoreViewport();
      api.removeEventListener('firstDataRendered', handler);
    };
    api.addEventListener('firstDataRendered', handler);
  }
}

/* ========================================================================== */
/*                                  STORAGE                                   */
/* ========================================================================== */

export const localStorageAdapter: StorageAdapter = {
  save(key, state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('[agGridStateManager] failed to write to localStorage', e);
    }
  },
  load(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SavedGridState;
    } catch (e) {
      console.error('[agGridStateManager] failed to parse saved state', e);
      return null;
    }
  },
  clear(key) {
    localStorage.removeItem(key);
  },
};

/* ========================================================================== */
/*                                   FACADE                                   */
/* ========================================================================== */

/**
 * Convenience wrapper binding a storage key + adapter to save/load operations.
 *
 * Usage:
 *   const stateMgr = new AgGridStateManager('marketsui:fi-positions');
 *
 *   const gridOptions: GridOptions = {
 *     columnDefs,
 *     rowData,
 *     initialState: stateMgr.getInitialState(),
 *     onFirstDataRendered: (e) => stateMgr.load(e.api),
 *     // For profile-management patterns, do NOT subscribe to onStateUpdated.
 *     // Call stateMgr.save(api) only from an explicit "Save Profile" button.
 *   };
 */
export class AgGridStateManager {
  constructor(
    private readonly storageKey: string,
    private readonly storage: StorageAdapter = localStorageAdapter
  ) {}

  /** Capture current grid state and persist to storage. */
  save(api: GridApi): void {
    this.storage.save(this.storageKey, captureGridState(api));
  }

  /** Load saved state and apply to a mounted grid. Returns false if nothing saved. */
  load(api: GridApi): boolean {
    const saved = this.storage.load(this.storageKey);
    if (!saved) return false;
    applyGridState(api, saved);
    return true;
  }

  /** Cleanest restore path: use as `initialState` in GridOptions at construction. */
  getInitialState(): GridState | undefined {
    return getInitialStateFor(this.storage.load(this.storageKey));
  }

  /** Read the raw saved state (e.g. for export, inspection, profile management). */
  read(): SavedGridState | null {
    return this.storage.load(this.storageKey);
  }

  /** Write a saved state directly (e.g. for import, profile switching). */
  write(state: SavedGridState): void {
    this.storage.save(this.storageKey, state);
  }

  /** Remove saved state from storage. */
  clear(): void {
    this.storage.clear(this.storageKey);
  }
}
