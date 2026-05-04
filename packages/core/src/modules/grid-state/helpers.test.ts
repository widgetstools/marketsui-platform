/**
 * Tests for the filter-model sanitisation helpers in `helpers.ts`.
 *
 * The end-to-end behavior we're protecting: persisted snapshots that
 * contain a malformed `agSetColumnFilter` model
 * (`{ filterType: 'set' }` without `values`, or `values: null`) used
 * to crash AG-Grid 35.2.x on reload via
 * `SetFilterHandler.validateModel` → `model.values is not iterable`.
 *
 * These helpers run on both ends of the persistence boundary — load
 * (so old bad snapshots can recover) and save (so transient bad
 * shapes from AG-Grid's own `getState()` don't poison the next
 * snapshot). The test suite covers each shape we expect to see in
 * the wild.
 */
import { describe, expect, it } from 'vitest';
import { __sanitiseFilterModelForTests as S } from './helpers';

const {
  isValidSetFilterModel,
  sanitiseColumnFilterModel,
  sanitiseFilterModelMap,
  sanitiseFilterModelInState,
} = S;

describe('isValidSetFilterModel', () => {
  it('accepts a model with an array values', () => {
    expect(isValidSetFilterModel({ filterType: 'set', values: ['EUR', 'USD'] })).toBe(true);
    expect(isValidSetFilterModel({ filterType: 'set', values: [] })).toBe(true);
  });

  it('rejects models without values, with non-array values, or non-objects', () => {
    expect(isValidSetFilterModel({ filterType: 'set' })).toBe(false);
    expect(isValidSetFilterModel({ filterType: 'set', values: null })).toBe(false);
    expect(isValidSetFilterModel({ filterType: 'set', values: undefined })).toBe(false);
    expect(isValidSetFilterModel({ filterType: 'set', values: 'EUR' })).toBe(false);
    expect(isValidSetFilterModel({ filterType: 'set', values: {} })).toBe(false);
    expect(isValidSetFilterModel(null)).toBe(false);
    expect(isValidSetFilterModel(undefined)).toBe(false);
    expect(isValidSetFilterModel('text')).toBe(false);
  });
});

describe('sanitiseColumnFilterModel', () => {
  it('passes through a healthy text filter unchanged', () => {
    const m = { filterType: 'text', type: 'contains', filter: 'abc' };
    expect(sanitiseColumnFilterModel(m)).toBe(m);
  });

  it('passes through a healthy set filter unchanged', () => {
    const m = { filterType: 'set', values: ['a', 'b'] };
    expect(sanitiseColumnFilterModel(m)).toBe(m);
  });

  it('drops a malformed bare set filter (returns undefined)', () => {
    expect(sanitiseColumnFilterModel({ filterType: 'set' })).toBeUndefined();
    expect(sanitiseColumnFilterModel({ filterType: 'set', values: null })).toBeUndefined();
  });

  it('within a multi-filter, drops the set child to null when malformed', () => {
    const text = { filterType: 'text', type: 'contains', filter: 'a' };
    const out = sanitiseColumnFilterModel({
      filterType: 'multi',
      filterModels: [text, { filterType: 'set' /* no values */ }],
    });
    expect(out).toEqual({
      filterType: 'multi',
      filterModels: [text, null],
    });
  });

  it('within a multi-filter, preserves a healthy set child', () => {
    const text = { filterType: 'text', type: 'contains', filter: 'a' };
    const set = { filterType: 'set', values: ['EUR', 'USD'] };
    const out = sanitiseColumnFilterModel({
      filterType: 'multi',
      filterModels: [text, set],
    });
    expect(out).toEqual({
      filterType: 'multi',
      filterModels: [text, set],
    });
  });

  it('drops the entire multi-filter when every child cleaned out to null', () => {
    const out = sanitiseColumnFilterModel({
      filterType: 'multi',
      filterModels: [null, { filterType: 'set' }],
    });
    expect(out).toBeUndefined();
  });

  it('returns undefined for non-object inputs without throwing', () => {
    expect(sanitiseColumnFilterModel(null)).toBeUndefined();
    expect(sanitiseColumnFilterModel(undefined)).toBeUndefined();
    expect(sanitiseColumnFilterModel('garbage')).toBeUndefined();
    expect(sanitiseColumnFilterModel(42)).toBeUndefined();
  });
});

describe('sanitiseFilterModelMap', () => {
  it('drops bad entries while preserving good ones', () => {
    const cleaned = sanitiseFilterModelMap({
      'price': { filterType: 'text', type: 'contains', filter: 'abc' },
      'currency': { filterType: 'set' /* malformed */ },
      'symbol': { filterType: 'set', values: ['AAPL'] },
    });
    expect(cleaned).toEqual({
      'price': { filterType: 'text', type: 'contains', filter: 'abc' },
      'symbol': { filterType: 'set', values: ['AAPL'] },
    });
    expect('currency' in cleaned).toBe(false);
  });

  it('returns a fresh object — never mutates the input', () => {
    const input = {
      'price': { filterType: 'text', type: 'contains', filter: 'abc' },
    };
    const out = sanitiseFilterModelMap(input);
    expect(out).not.toBe(input);
    // Input untouched.
    expect(input).toEqual({
      'price': { filterType: 'text', type: 'contains', filter: 'abc' },
    });
  });
});

describe('sanitiseFilterModelInState', () => {
  it('walks gridState.filter.filterModel and replaces with the sanitised map', () => {
    const state = {
      columnOrder: { orderedColIds: ['price', 'currency'] },
      filter: {
        filterModel: {
          'price': { filterType: 'text', type: 'contains', filter: 'a' },
          'currency': { filterType: 'set' /* bad */ },
        },
      },
    };
    const out = sanitiseFilterModelInState(state);
    expect(out.filter).toEqual({
      filterModel: {
        'price': { filterType: 'text', type: 'contains', filter: 'a' },
      },
    });
    // Other state slices are preserved by reference where possible.
    expect(out.columnOrder).toBe(state.columnOrder);
  });

  it('passes through state without a filter section unchanged', () => {
    const state = { columnOrder: { orderedColIds: ['a', 'b'] } };
    const out = sanitiseFilterModelInState(state);
    expect(out).toBe(state);
  });

  it('passes through state with no filterModel inside filter unchanged', () => {
    const state = { filter: { advancedFilterModel: 'something' } };
    const out = sanitiseFilterModelInState(state);
    expect(out).toBe(state);
  });

  it('returns an empty object for null / undefined input', () => {
    expect(sanitiseFilterModelInState(undefined)).toEqual({});
    expect(sanitiseFilterModelInState(null)).toEqual({});
  });

  it('does not mutate the input object', () => {
    const state = {
      filter: {
        filterModel: { 'currency': { filterType: 'set' } },
      },
    };
    const before = JSON.stringify(state);
    sanitiseFilterModelInState(state);
    expect(JSON.stringify(state)).toBe(before);
  });
});
