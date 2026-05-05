import { X } from 'lucide-react';
import { IconInput } from '../../../ui/SettingsPanel';
import { Select, Switch } from '../../../ui/shadcn';
import type {
  ColumnFilterConfig,
  FilterKind,
  FloatingFilterStyle,
  MultiFilterEntry,
  SetFilterOptions,
} from '../state';
import { Row } from './Row';

/**
 * Filter-kind editor trio — extracted from ColumnSettingsPanel.tsx during
 * the AUDIT M3 split. Covers:
 *
 *   - FilterEditor       — master enable / kind / floating / buttons /
 *                          debounce / closeOnApply for every filter.
 *   - SetFilterOptionsEditor — set-filter-specific toggles.
 *   - MultiFilterEditor  — sub-filter list with display-mode picker.
 *
 * All three reuse the `Row` primitive and write into `ColumnFilterConfig`
 * via the `onChange` callback the parent editor provides. Pure
 * presentational — draft / save orchestration stays in the parent.
 */

export const FILTER_KIND_OPTIONS: Array<{ value: FilterKind; label: string; hint?: string }> = [
  { value: 'agTextColumnFilter',   label: 'Text',          hint: 'contains / equals / starts with…' },
  { value: 'agNumberColumnFilter', label: 'Number',        hint: 'equals / >, <, between…' },
  { value: 'agDateColumnFilter',   label: 'Date',          hint: 'equals / before / after / between' },
  { value: 'agSetColumnFilter',    label: 'List of values',hint: 'multi-select checkbox list (Enterprise)' },
  { value: 'agMultiColumnFilter',  label: 'Multi (combine)', hint: 'stack two or more filter types in one popup (Enterprise)' },
];

export const FLOATING_FILTER_STYLE_OPTIONS: Array<{ value: FloatingFilterStyle; label: string; hint?: string }> = [
  { value: 'default',     label: 'Default',                  hint: 'AG-Grid native — sub-filter rotation, read-only set display' },
  { value: 'tokenText',   label: 'Token search — text',      hint: 'Typeable input. CSV → exact-match list. Single token → contains.' },
  { value: 'tokenNumber', label: 'Token search — number',    hint: '>100, 100-150, >0 and <50, =100 or =200, CSV of numbers' },
];

const BUTTONS_ALL = ['apply', 'clear', 'reset', 'cancel'] as const;

export function FilterEditor({
  colId,
  value,
  onChange,
}: {
  colId: string;
  value: ColumnFilterConfig | undefined;
  onChange: (next: ColumnFilterConfig | undefined) => void;
}) {
  const cfg = value ?? {};

  // Normalise: if the user clears everything the config collapses to undefined
  // so the assignment stays minimal.
  const update = (patch: Partial<ColumnFilterConfig>) => {
    const next: ColumnFilterConfig = { ...cfg, ...patch };
    // Drop empty keys so `isEmptyAssignment` can still collapse.
    (Object.keys(next) as Array<keyof ColumnFilterConfig>).forEach((k) => {
      const v = next[k];
      if (v === undefined) delete next[k];
      if (Array.isArray(v) && v.length === 0) delete next[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) {
        delete next[k];
      }
    });
    onChange(Object.keys(next).length === 0 ? undefined : next);
  };

  const kind = cfg.kind;
  const enabledState: 'default' | 'on' | 'off' =
    cfg.enabled === false ? 'off' : cfg.enabled === true || kind ? 'on' : 'default';

  return (
    <>
      <Row
        label="FILTER"
        hint='"On" uses the kind below · "Off" disables filtering · "Default" inherits'
        control={
          <Select
            value={enabledState}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'on') update({ enabled: true, kind: kind ?? 'agTextColumnFilter' });
              else if (v === 'off') update({ enabled: false });
              else update({ enabled: undefined });
            }}
            data-testid={`cols-${colId}-filter-enabled`}
            style={{ maxWidth: 180 }}
          >
            <option value="default">Host default</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </Select>
        }
      />

      {enabledState !== 'off' && (
        <>
          <Row
            label="FILTER TYPE"
            hint={
              kind
                ? FILTER_KIND_OPTIONS.find((o) => o.value === kind)?.hint ?? ''
                : 'Inherit the column\'s host-default filter'
            }
            control={
              <Select
                value={kind ?? ''}
                onChange={(e) => {
                  const v = e.target.value as FilterKind | '';
                  const patch: Partial<ColumnFilterConfig> = { kind: v || undefined };
                  // Switching away from Multi clears any
                  // floatingFilterStyle — it's only meaningful for Multi.
                  if (v !== 'agMultiColumnFilter') {
                    patch.floatingFilterStyle = undefined;
                  }
                  update(patch);
                }}
                data-testid={`cols-${colId}-filter-kind`}
                style={{ maxWidth: 220 }}
              >
                <option value="">Inherit default</option>
                {FILTER_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            }
          />

          <Row
            label="FLOATING FILTER"
            hint="Show a compact filter input under the column header"
            control={
              <Switch
                checked={cfg.floatingFilter ?? false}
                onChange={(e) => update({ floatingFilter: e.target.checked || undefined })}
                data-testid={`cols-${colId}-filter-floating`}
              />
            }
          />

          {/* Floating-filter style — only meaningful for Multi-combine
              with floating filter ON. The streamSafe components require
              both. Hidden otherwise to keep the panel uncluttered. */}
          {kind === 'agMultiColumnFilter' && cfg.floatingFilter && (
            <Row
              label="FLOATING FILTER STYLE"
              hint={
                FLOATING_FILTER_STYLE_OPTIONS.find(
                  (o) => o.value === (cfg.floatingFilterStyle ?? 'default'),
                )?.hint ?? ''
              }
              control={
                <Select
                  value={cfg.floatingFilterStyle ?? 'default'}
                  onChange={(e) => {
                    const v = e.target.value as FloatingFilterStyle;
                    const patch: Partial<ColumnFilterConfig> = {
                      floatingFilterStyle: v === 'default' ? undefined : v,
                    };
                    // Token-search styles need a matching sub-filter
                    // slot to plant their model into:
                    //   tokenText   → agTextColumnFilter sub-filter
                    //   tokenNumber → agNumberColumnFilter sub-filter
                    // When the user hasn't authored sub-filters yet,
                    // seed a sensible default so the floating filter
                    // works out of the box. CSV → set sub-filter is
                    // also an integral part of the streamSafe routing,
                    // so include agSetColumnFilter too.
                    const currentSubs = cfg.multiFilters ?? [];
                    const hasNumber = currentSubs.some((m) => m.filter === 'agNumberColumnFilter');
                    const hasText = currentSubs.some((m) => m.filter === 'agTextColumnFilter');
                    if (v === 'tokenNumber' && !hasNumber) {
                      patch.multiFilters = [
                        { filter: 'agNumberColumnFilter', display: 'subMenu', title: 'Number' },
                        ...currentSubs.filter((m) => m.filter !== 'agNumberColumnFilter'),
                        ...(currentSubs.some((m) => m.filter === 'agSetColumnFilter')
                          ? []
                          : [{ filter: 'agSetColumnFilter' as const, display: 'subMenu' as const, title: 'Set' }]),
                      ];
                    } else if (v === 'tokenText' && !hasText) {
                      patch.multiFilters = [
                        { filter: 'agTextColumnFilter', display: 'subMenu', title: 'Text' },
                        ...currentSubs.filter((m) => m.filter !== 'agTextColumnFilter'),
                        ...(currentSubs.some((m) => m.filter === 'agSetColumnFilter')
                          ? []
                          : [{ filter: 'agSetColumnFilter' as const, display: 'subMenu' as const, title: 'Set' }]),
                      ];
                    }
                    update(patch);
                  }}
                  data-testid={`cols-${colId}-floating-filter-style`}
                  style={{ maxWidth: 240 }}
                >
                  {FLOATING_FILTER_STYLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              }
            />
          )}

          <Row
            label="BUTTONS"
            hint="Popup buttons shown under the filter controls"
            control={
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {BUTTONS_ALL.map((b) => {
                  const active = (cfg.buttons ?? []).includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        const cur = cfg.buttons ?? [];
                        const next = active
                          ? cur.filter((x) => x !== b)
                          : [...cur, b].sort(
                              (a, z) =>
                                BUTTONS_ALL.indexOf(a as typeof BUTTONS_ALL[number]) -
                                BUTTONS_ALL.indexOf(z as typeof BUTTONS_ALL[number]),
                            );
                        update({ buttons: next as ColumnFilterConfig['buttons'] });
                      }}
                      data-testid={`cols-${colId}-filter-btn-${b}`}
                      data-active={active ? 'true' : 'false'}
                      style={{
                        height: 24,
                        padding: '0 10px',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: active ? 'var(--ck-green)' : 'var(--ck-border)',
                        background: active
                          ? 'var(--ck-green-bg, rgba(45,212,191,0.12))'
                          : 'var(--ck-bg, transparent)',
                        color: active ? 'var(--ck-green)' : 'var(--ck-t1, var(--bn-t2))',
                        cursor: 'pointer',
                        transition: 'all 120ms',
                      }}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            }
          />

          {kind !== 'agSetColumnFilter' && (
            <Row
              label="DEBOUNCE (MS)"
              hint="Wait N ms after typing before firing · blank = default"
              control={
                <IconInput
                  value={cfg.debounceMs != null ? String(cfg.debounceMs) : ''}
                  numeric
                  suffix="MS"
                  onCommit={(raw) => {
                    if (!raw.trim()) return update({ debounceMs: undefined });
                    const n = Number(raw);
                    if (Number.isFinite(n) && n >= 0) update({ debounceMs: n });
                  }}
                  data-testid={`cols-${colId}-filter-debounce`}
                  style={{ maxWidth: 160 }}
                />
              }
            />
          )}

          <Row
            label="CLOSE ON APPLY"
            hint="Auto-close the filter popup when Apply is clicked"
            control={
              <Switch
                checked={cfg.closeOnApply ?? false}
                onChange={(e) => update({ closeOnApply: e.target.checked || undefined })}
                data-testid={`cols-${colId}-filter-closeonapply`}
              />
            }
          />

          {kind === 'agSetColumnFilter' && (
            <SetFilterOptionsEditor
              colId={colId}
              value={cfg.setFilterOptions}
              onChange={(next) => update({ setFilterOptions: next })}
            />
          )}

          {kind === 'agMultiColumnFilter' && (
            <MultiFilterEditor
              colId={colId}
              value={cfg.multiFilters}
              onChange={(next) => update({ multiFilters: next })}
            />
          )}
        </>
      )}
    </>
  );
}

function SetFilterOptionsEditor({
  colId,
  value,
  onChange,
}: {
  colId: string;
  value: SetFilterOptions | undefined;
  onChange: (next: SetFilterOptions | undefined) => void;
}) {
  const s = value ?? {};
  const patch = (next: Partial<SetFilterOptions>) => {
    const merged: SetFilterOptions = { ...s, ...next };
    (Object.keys(merged) as Array<keyof SetFilterOptions>).forEach((k) => {
      if (merged[k] === undefined) delete merged[k];
    });
    onChange(Object.keys(merged).length === 0 ? undefined : merged);
  };
  return (
    <>
      <Row
        label="MINI FILTER"
        hint="Quick-search box at the top of the set-filter popup"
        control={
          <Switch
            checked={!s.suppressMiniFilter}
            onChange={(e) => patch({ suppressMiniFilter: !e.target.checked || undefined })}
            data-testid={`cols-${colId}-setfilter-minifilter`}
          />
        }
      />
      <Row
        label="SELECT-ALL CHECKBOX"
        control={
          <Switch
            checked={!s.suppressSelectAll}
            onChange={(e) => patch({ suppressSelectAll: !e.target.checked || undefined })}
            data-testid={`cols-${colId}-setfilter-selectall`}
          />
        }
      />
      <Row
        label="ALPHABETICAL SORT"
        hint="Uncheck to preserve data order"
        control={
          <Switch
            checked={!s.suppressSorting}
            onChange={(e) => patch({ suppressSorting: !e.target.checked || undefined })}
            data-testid={`cols-${colId}-setfilter-sorting`}
          />
        }
      />
      <Row
        label="EXCEL MODE"
        hint="Mimic Excel's Windows / Mac auto-filter semantics"
        control={
          <Select
            value={s.excelMode ?? 'off'}
            onChange={(e) => {
              const v = e.target.value;
              patch({ excelMode: v === 'windows' || v === 'mac' ? v : undefined });
            }}
            data-testid={`cols-${colId}-setfilter-excel`}
            style={{ maxWidth: 180 }}
          >
            <option value="off">Off</option>
            <option value="windows">Windows</option>
            <option value="mac">Mac</option>
          </Select>
        }
      />
      <Row
        label="DEFAULT TO NOTHING"
        hint="Start with no values selected (otherwise all selected)"
        control={
          <Switch
            checked={s.defaultToNothingSelected ?? false}
            onChange={(e) => patch({ defaultToNothingSelected: e.target.checked || undefined })}
            data-testid={`cols-${colId}-setfilter-dtn`}
          />
        }
      />
    </>
  );
}

function MultiFilterEditor({
  colId,
  value,
  onChange,
}: {
  colId: string;
  value: MultiFilterEntry[] | undefined;
  onChange: (next: MultiFilterEntry[] | undefined) => void;
}) {
  const entries = value ?? [];
  const commit = (next: MultiFilterEntry[]) =>
    onChange(next.length === 0 ? undefined : next);

  return (
    <>
      <Row
        label="SUB-FILTERS"
        hint="Ordered list of filters stacked inside agMultiColumnFilter"
        control={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {entries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  padding: '4px 6px',
                  borderRadius: 3,
                  border: '1px solid var(--ck-border)',
                  background: 'var(--ck-card, transparent)',
                }}
              >
                <Select
                  value={entry.filter}
                  onChange={(e) => {
                    const next = [...entries];
                    next[idx] = { ...entry, filter: e.target.value as FilterKind };
                    commit(next);
                  }}
                  data-testid={`cols-${colId}-multi-${idx}-kind`}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {FILTER_KIND_OPTIONS.filter((o) => o.value !== 'agMultiColumnFilter').map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={entry.display ?? 'inline'}
                  onChange={(e) => {
                    const next = [...entries];
                    next[idx] = {
                      ...entry,
                      display: e.target.value as MultiFilterEntry['display'],
                    };
                    commit(next);
                  }}
                  data-testid={`cols-${colId}-multi-${idx}-display`}
                  style={{ maxWidth: 120 }}
                >
                  <option value="inline">Inline</option>
                  <option value="subMenu">Sub-menu</option>
                  <option value="accordion">Accordion</option>
                </Select>
                <button
                  type="button"
                  onClick={() => commit(entries.filter((_, i) => i !== idx))}
                  title="Remove sub-filter"
                  data-testid={`cols-${colId}-multi-${idx}-remove`}
                  style={{
                    width: 22,
                    height: 22,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ck-t2, var(--bn-t2))',
                    cursor: 'pointer',
                    borderRadius: 3,
                  }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
            <Select
              value=""
              onChange={(e) => {
                const v = e.target.value as FilterKind | '';
                if (!v) return;
                commit([...entries, { filter: v, display: 'inline' }]);
              }}
              data-testid={`cols-${colId}-multi-add`}
              style={{ maxWidth: 280 }}
            >
              <option value="">Add sub-filter…</option>
              {FILTER_KIND_OPTIONS.filter((o) => o.value !== 'agMultiColumnFilter').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />
    </>
  );
}
