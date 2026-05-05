/**
 * Column-customization state shapes.
 *
 * The base `ColumnAssignment` lives in `colDef/types.ts` — imported here
 * and re-exported with the rich `filter` / `rowGrouping` shapes narrowed
 * from `unknown` to the concrete configs below.
 */
import type {
  BorderSpec,
  CellStyleOverrides,
  ColumnAssignment as BaseAssignment,
  PresetId,
  TickToken,
  ValueFormatterTemplate,
} from '../../colDef';

// Re-export shared colDef types from this module's state.ts so v2 panels
// that import from `./state` (and can't easily be rewritten to reach into
// colDef directly) keep working.
export type { BorderSpec, CellStyleOverrides, PresetId, TickToken, ValueFormatterTemplate };

// ─── Filter config ──────────────────────────────────────────────────────────

export type FilterKind =
  | 'agTextColumnFilter'
  | 'agNumberColumnFilter'
  | 'agDateColumnFilter'
  | 'agSetColumnFilter'
  | 'agMultiColumnFilter';

/**
 * Floating-filter visual style. Only meaningful when `kind` is
 * `agMultiColumnFilter` and `floatingFilter` is true; ignored for all
 * other shapes. Splits the "what filter logic" question from the
 * "what does the typed input do" question — keeps the column-settings
 * dropdown showing only real AG-Grid filter types and lets users opt
 * into our streamSafe components as a separate, dependent choice.
 *
 *   - `default`     — AG-Grid's built-in floating filter (sub-filter
 *                     auto-rotation, read-only set display, etc.)
 *   - `tokenText`   — streamSafeText: typeable input, clear ✕ button,
 *                     CSV → set values, single-token → contains
 *   - `tokenNumber` — streamSafeNumber: typeable input with operator
 *                     parser (>100, 100-150, >0 and <50, =100 or =200,
 *                     CSV → set values)
 */
export type FloatingFilterStyle = 'default' | 'tokenText' | 'tokenNumber';

/** AG-Grid set-filter params we expose in the UI. */
export interface SetFilterOptions {
  suppressMiniFilter?: boolean;
  suppressSelectAll?: boolean;
  suppressSorting?: boolean;
  excelMode?: 'windows' | 'mac';
  defaultToNothingSelected?: boolean;
}

/** One entry in an `agMultiColumnFilter.filterParams.filters[]` list. */
export interface MultiFilterEntry {
  filter: FilterKind;
  display?: 'inline' | 'subMenu' | 'accordion';
  title?: string;
}

export interface ColumnFilterConfig {
  /**
   * Master toggle. `false` disables filtering on this column regardless of
   * `kind` / `floatingFilter`. Takes precedence over `filterable`.
   */
  enabled?: boolean;
  kind?: FilterKind;
  floatingFilter?: boolean;
  debounceMs?: number;
  closeOnApply?: boolean;
  buttons?: Array<'apply' | 'clear' | 'reset' | 'cancel'>;
  setFilterOptions?: SetFilterOptions;
  multiFilters?: MultiFilterEntry[];
  /**
   * Visual style for the floating filter input. Only honoured when
   * `kind === 'agMultiColumnFilter'` and `floatingFilter === true`;
   * otherwise the colDef gets AG-Grid's default floating filter.
   * `'default'` (or undefined) = AG-Grid native; `'tokenText'` /
   * `'tokenNumber'` = our streamSafe components. See
   * `FloatingFilterStyle` above for the details.
   */
  floatingFilterStyle?: FloatingFilterStyle;
}

// ─── Row-grouping / aggregation config ─────────────────────────────────────

export type AggFuncName =
  | 'sum'
  | 'min'
  | 'max'
  | 'count'
  | 'avg'
  | 'first'
  | 'last'
  | 'custom';

export interface RowGroupingConfig {
  // Tool-panel interactivity
  enableRowGroup?: boolean;
  enableValue?: boolean;
  enablePivot?: boolean;

  // Initial state
  rowGroup?: boolean;
  rowGroupIndex?: number;
  pivot?: boolean;
  pivotIndex?: number;

  // Aggregation
  aggFunc?: AggFuncName;
  /**
   * User-defined aggregation formula — compiled through the core expression
   * engine. Aggregate values array is exposed as `[value]`; formulas like
   * `SUM([value]) * 1.1` sum the aggregate values then multiply. Only read
   * when `aggFunc === 'custom'`.
   */
  customAggExpression?: string;
  /** Subset of aggFunc names allowed in the tool panel. */
  allowedAggFuncs?: string[];
}

// ─── Column assignment (narrowed) ──────────────────────────────────────────

export type ColumnAssignment = Omit<BaseAssignment, 'filter' | 'rowGrouping'> & {
  filter?: ColumnFilterConfig;
  rowGrouping?: RowGroupingConfig;
};

// ─── Module state ──────────────────────────────────────────────────────────

export interface ColumnCustomizationState {
  /** colId → assignment. Missing key = no overrides for that column. */
  assignments: Record<string, ColumnAssignment>;
}

export const INITIAL_COLUMN_CUSTOMIZATION: ColumnCustomizationState = {
  assignments: {},
};
