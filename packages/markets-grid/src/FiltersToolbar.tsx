import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { GridCustomizerCore, GridStore } from '@grid-customizer/core';
import { Button, Input, Tooltip, cn } from '@grid-customizer/core';
import { Plus, Save, Check, Filter, Pencil, Trash2 } from 'lucide-react';
import type { SavedFilter } from './types';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FiltersToolbarProps {
  core: GridCustomizerCore;
  store: GridStore;
  gridId: string;
  activeFiltersRef: React.MutableRefObject<SavedFilter[]>;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useFlashConfirm(): [boolean, () => void] {
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback(() => {
    setConfirmed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setConfirmed(false), 400);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return [confirmed, flash];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function storageKey(gridId: string) {
  return `gc-filters:${gridId}`;
}

function loadFilters(gridId: string): SavedFilter[] {
  try {
    const raw = localStorage.getItem(storageKey(gridId));
    if (raw) return JSON.parse(raw) as SavedFilter[];
  } catch { /* ignore */ }
  return [];
}

function generateLabel(filterModel: Record<string, any>, existingCount: number): string {
  const keys = Object.keys(filterModel);
  if (keys.length === 0) return `Filter ${existingCount + 1}`;

  if (keys.length === 1) {
    const col = keys[0];
    const entry = filterModel[col];
    // Try to extract a readable value from the filter entry
    const val = entry?.filter ?? entry?.value ?? entry?.values?.[0];
    if (val != null) return `${col}: ${val}`;
    return col;
  }

  if (keys.length === 2) {
    return `${keys[0]} + ${keys[1]}`;
  }

  return `${keys[0]} + ${keys.length - 1} more`;
}

function makeId(): string {
  return `sf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FiltersToolbar({ core, store, gridId, activeFiltersRef }: FiltersToolbarProps) {
  const [filters, setFilters] = useState<SavedFilter[]>(() => loadFilters(gridId));
  const [saveConfirmed, flashSave] = useFlashConfirm();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Keep activeFiltersRef in sync
  useEffect(() => {
    activeFiltersRef.current = filters.filter(f => f.active);
  }, [filters, activeFiltersRef]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  // ─── Apply active filters to grid ──────────────────────────────────────

  const applyActiveFilters = useCallback((updated: SavedFilter[]) => {
    const api = core.getGridApi();
    if (!api) return;
    const active = updated.filter(f => f.active);

    if (active.length === 0) {
      api.setFilterModel(null);
    } else if (active.length === 1) {
      api.setFilterModel(active[0].filterModel);
    } else {
      // Multiple active: clear grid filter model and use external filter via ref
      api.setFilterModel(null);
      api.onFilterChanged();
    }
  }, [core]);

  // ─── Add filter ────────────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    const api = core.getGridApi();
    if (!api) return;
    const model = api.getFilterModel();
    if (!model || Object.keys(model).length === 0) return;

    const newFilter: SavedFilter = {
      id: makeId(),
      label: generateLabel(model, filters.length),
      filterModel: model,
      active: true,
    };
    const updated = [...filters, newFilter];
    setFilters(updated);
    applyActiveFilters(updated);
  }, [core, filters, applyActiveFilters]);

  // ─── Toggle filter ─────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    const updated = filters.map(f => f.id === id ? { ...f, active: !f.active } : f);
    setFilters(updated);
    applyActiveFilters(updated);
  }, [filters, applyActiveFilters]);

  // ─── Remove filter ─────────────────────────────────────────────────────

  const handleRemove = useCallback((id: string) => {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    setContextMenu(null);
    applyActiveFilters(updated);
  }, [filters, applyActiveFilters]);

  // ─── Rename ────────────────────────────────────────────────────────────

  const handleStartRename = useCallback((id: string) => {
    setRenameId(id);
    setContextMenu(null);
  }, []);

  const handleConfirmRename = useCallback((id: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (trimmed) {
      setFilters(prev => prev.map(f => f.id === id ? { ...f, label: trimmed } : f));
    }
    setRenameId(null);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenameId(null);
  }, []);

  // ─── Save ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    localStorage.setItem(storageKey(gridId), JSON.stringify(filters));
    flashSave();
  }, [gridId, filters, flashSave]);

  // ─── Context menu handler ──────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="h-9 border-b border-border bg-card flex items-center gap-1"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      {/* Add button */}
      <Tooltip content="Capture current filter">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 w-7 h-7 rounded-[4px] gc-tbtn"
          onClick={handleAdd}
        >
          <Plus size={14} strokeWidth={1.75} />
        </Button>
      </Tooltip>

      {/* Separator */}
      {filters.length > 0 && <div className="gc-toolbar-sep" />}

      {/* Filter toggle buttons + save (flex-1 to push save right) */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0">
        {filters.map(f => {
          if (renameId === f.id) {
            return (
              <input
                key={f.id}
                ref={renameInputRef}
                defaultValue={f.label}
                autoFocus
                className="h-6 w-28 text-xs px-1.5 rounded border border-border bg-background text-foreground outline-none focus:border-primary"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmRename(f.id, (e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') handleCancelRename();
                }}
                onBlur={e => handleConfirmRename(f.id, e.target.value)}
              />
            );
          }

          return (
            <button
              key={f.id}
              type="button"
              title={`${f.label} — click to toggle, right-click for options`}
              className={cn(
                'inline-flex items-center gap-1 px-2 h-6 rounded border text-[10px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap',
                f.active
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-transparent text-muted-foreground border-border opacity-60',
              )}
              onClick={() => handleToggle(f.id)}
              onContextMenu={e => handleContextMenu(e, f.id)}
            >
              <Filter size={10} strokeWidth={1.75} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      {filters.length > 0 && (
        <Tooltip content="Save filters">
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn('shrink-0 w-7 h-7 rounded-[4px] gc-tbtn', saveConfirmed && 'gc-tbtn-confirm')}
            onClick={handleSave}
          >
            {saveConfirmed
              ? <Check size={14} strokeWidth={2.5} style={{ color: 'var(--bn-green, #2dd4bf)' }} />
              : <Save size={14} strokeWidth={1.75} />}
          </Button>
        </Tooltip>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-[10010] bg-card border border-border rounded-md shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => handleStartRename(contextMenu.id)}
          >
            <Pencil size={12} strokeWidth={1.75} />
            Rename
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted transition-colors cursor-pointer"
            onClick={() => handleRemove(contextMenu.id)}
          >
            <Trash2 size={12} strokeWidth={1.75} />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
