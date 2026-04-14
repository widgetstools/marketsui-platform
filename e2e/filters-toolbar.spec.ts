import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for the Filters Toolbar feature.
 * Tests: empty state, capture, toggle on/off, OR logic, context menu,
 * rename, remove, save/persist.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function waitForGrid(page: Page) {
  await page.waitForSelector('.ag-body-viewport .ag-row', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

async function clearPersistedState(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('gc-state:') || k.startsWith('gc-filters:'))
      .forEach(k => localStorage.removeItem(k));
  });
}

async function switchToFilters(page: Page) {
  const switcher = page.locator('.gc-toolbar-switcher');
  // Hover above the toolbar to reveal the pill rail
  await switcher.hover({ position: { x: 100, y: 5 } });
  await page.waitForTimeout(400);
  const filtersPill = page.locator('.gc-pill-label', { hasText: 'Filters' });
  await filtersPill.click();
  await page.waitForTimeout(400);
}

function filterButtons(page: Page) {
  return page.locator('button[title*="click to toggle"]');
}

async function getFilterButtonCount(page: Page): Promise<number> {
  return filterButtons(page).count();
}

async function clickAddFilter(page: Page) {
  // The + button has tooltip "Capture current filter"
  const addBtn = page.locator('.gc-toolbar-content button').first();
  await addBtn.click();
  await page.waitForTimeout(400);
}

async function getDisplayedRowCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    // Use the status bar text which shows "X of Y" filtered count
    const statusText = document.querySelector('.ag-status-bar')?.textContent ?? '';
    const match = statusText.match(/(\d+)\s+of\s+(\d+)/);
    if (match) return parseInt(match[1], 10);

    // Fallback: walk React fiber to find grid API
    const gridRoot = document.querySelector('.ag-root-wrapper');
    if (!gridRoot) return -1;
    const fiberKey = Object.keys(gridRoot).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return -1;
    let fiber = (gridRoot as any)[fiberKey];
    for (let i = 0; i < 80 && fiber; i++) {
      if (fiber.stateNode?.api?.getDisplayedRowCount) {
        return fiber.stateNode.api.getDisplayedRowCount();
      }
      if (fiber.memoizedState) {
        let state = fiber.memoizedState;
        while (state) {
          const ms = state.memoizedState;
          if (ms?.api?.getDisplayedRowCount) return ms.api.getDisplayedRowCount();
          if (ms?.current?.api?.getDisplayedRowCount) return ms.current.api.getDisplayedRowCount();
          state = state.next;
        }
      }
      fiber = fiber.return;
    }
    return -1;
  });
}

/**
 * Set filter model on the AG-Grid instance by walking the React fiber tree.
 */
async function setFilterViaApi(page: Page, filterModel: Record<string, any>) {
  const result = await page.evaluate((model) => {
    const gridRoot = document.querySelector('.ag-root-wrapper');
    if (!gridRoot) return 'no-grid-root';

    // Walk React fiber to find the grid API
    const fiberKey = Object.keys(gridRoot).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return 'no-fiber';

    let fiber = (gridRoot as any)[fiberKey];
    for (let i = 0; i < 80 && fiber; i++) {
      // Check stateNode for class components (AgGridReact)
      if (fiber.stateNode && fiber.stateNode.api && typeof fiber.stateNode.api.setFilterModel === 'function') {
        fiber.stateNode.api.setFilterModel(model);
        return 'ok-stateNode';
      }
      // Check memoizedState chain for hooks
      if (fiber.memoizedState) {
        let state = fiber.memoizedState;
        while (state) {
          const ms = state.memoizedState;
          if (ms && ms.api && typeof ms.api.setFilterModel === 'function') {
            ms.api.setFilterModel(model);
            return 'ok-memoizedState';
          }
          // Check queue-based refs
          if (ms && ms.current && ms.current.api && typeof ms.current.api.setFilterModel === 'function') {
            ms.current.api.setFilterModel(model);
            return 'ok-ref';
          }
          state = state.next;
        }
      }
      fiber = fiber.return;
    }
    return 'not-found';
  }, filterModel);
  await page.waitForTimeout(500);
  return result;
}

/**
 * Alternative: set filter via column header menu UI for set filters.
 */
async function setSetFilterViaUI(page: Page, colId: string, values: string[]) {
  // Right-click the column header to open context menu, then use filter
  const header = page.locator(`.ag-header-cell[col-id="${colId}"]`);

  // Click the header menu button (three dots)
  const menuBtn = header.locator('.ag-header-cell-menu-button');
  // Make it visible by hovering on header
  await header.hover();
  await page.waitForTimeout(300);
  await menuBtn.click();
  await page.waitForTimeout(500);

  // Click the Filter tab in the column menu
  const filterTab = page.locator('.ag-tabs-header .ag-tab').nth(1);
  await filterTab.click();
  await page.waitForTimeout(300);

  // First, deselect all
  const selectAll = page.locator('.ag-set-filter-list .ag-set-filter-item').first();
  await selectAll.click();
  await page.waitForTimeout(200);

  // Select specific values
  for (const val of values) {
    const item = page.locator('.ag-set-filter-item').filter({ hasText: val });
    await item.click();
    await page.waitForTimeout(100);
  }

  // Close the menu by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Filters Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearPersistedState(page);
    await page.reload();
    await waitForGrid(page);
  });

  test('shows empty toolbar with only + button', async ({ page }) => {
    await switchToFilters(page);

    // The + button should exist
    const addBtn = page.locator('.gc-toolbar-content button').first();
    await expect(addBtn).toBeVisible();

    // No toggle buttons should exist
    const count = await getFilterButtonCount(page);
    expect(count).toBe(0);
  });

  test('+ button does nothing when no filters are set', async ({ page }) => {
    await switchToFilters(page);

    // Click + with no grid filters active
    await clickAddFilter(page);

    // Still no toggle buttons
    const count = await getFilterButtonCount(page);
    expect(count).toBe(0);
  });

  test('captures current filter as toggle button', async ({ page }) => {
    // Set a filter on the grid programmatically
    const result = await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });

    // Switch to Filters toolbar
    await switchToFilters(page);

    // Click + to capture
    await clickAddFilter(page);

    // Verify a toggle button appeared
    const count = await getFilterButtonCount(page);
    expect(count).toBe(1);

    // Verify the button label contains the filter info
    const btn = filterButtons(page).first();
    const title = await btn.getAttribute('title');
    expect(title).toContain('click to toggle');
  });

  test('toggle off removes filter from grid', async ({ page }) => {
    // Set a filter
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });

    // Capture the filtered row count
    const filteredCount = await getDisplayedRowCount(page);

    // Switch to Filters and capture
    await switchToFilters(page);
    await clickAddFilter(page);

    // Toggle off
    const btn = filterButtons(page).first();
    await btn.click();
    await page.waitForTimeout(500);

    // Row count should increase (filter removed)
    const unfilteredCount = await getDisplayedRowCount(page);
    expect(unfilteredCount).toBeGreaterThan(filteredCount);
  });

  test('toggle on re-applies filter', async ({ page }) => {
    // Set a filter
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });

    const filteredCount = await getDisplayedRowCount(page);

    // Switch to Filters, capture, toggle off
    await switchToFilters(page);
    await clickAddFilter(page);

    const btn = filterButtons(page).first();
    await btn.click(); // toggle off
    await page.waitForTimeout(500);

    const unfilteredCount = await getDisplayedRowCount(page);
    expect(unfilteredCount).toBeGreaterThan(filteredCount);

    // Toggle on again
    await btn.click();
    await page.waitForTimeout(500);

    const reFilteredCount = await getDisplayedRowCount(page);
    expect(reFilteredCount).toBeLessThan(unfilteredCount);
  });

  test('multiple filters with OR logic', async ({ page }) => {
    // Set and capture first filter: side=BUY
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });
    await switchToFilters(page);
    await clickAddFilter(page);

    const buyOnlyCount = await getDisplayedRowCount(page);

    // Toggle off first filter before setting second
    const btn1 = filterButtons(page).first();
    await btn1.click();
    await page.waitForTimeout(500);

    // Set and capture second filter: status=FILLED
    await setFilterViaApi(page, {
      status: { filterType: 'set', values: ['FILLED'] },
    });
    await page.waitForTimeout(300);
    await clickAddFilter(page);

    const filledOnlyCount = await getDisplayedRowCount(page);

    // Now activate both — should be OR logic showing more rows
    await btn1.click(); // toggle BUY back on
    await page.waitForTimeout(500);

    const bothCount = await getDisplayedRowCount(page);
    // OR of two filters should show >= max(buy, filled) rows
    expect(bothCount).toBeGreaterThanOrEqual(Math.max(buyOnlyCount, filledOnlyCount));
  });

  test('right-click shows context menu', async ({ page }) => {
    // Set a filter and capture
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });
    await switchToFilters(page);
    await clickAddFilter(page);

    // Right-click the toggle button
    const btn = filterButtons(page).first();
    await btn.click({ button: 'right' });
    await page.waitForTimeout(300);

    // Context menu should appear with Rename and Remove
    const contextMenu = page.locator('.fixed.z-\\[10010\\]');
    await expect(contextMenu).toBeVisible();

    const rename = contextMenu.locator('button', { hasText: 'Rename' });
    const remove = contextMenu.locator('button', { hasText: 'Remove' });
    await expect(rename).toBeVisible();
    await expect(remove).toBeVisible();
  });

  test('rename updates label', async ({ page }) => {
    // Set a filter and capture
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });
    await switchToFilters(page);
    await clickAddFilter(page);

    // Right-click and choose Rename
    const btn = filterButtons(page).first();
    await btn.click({ button: 'right' });
    await page.waitForTimeout(300);

    const contextMenu = page.locator('.fixed.z-\\[10010\\]');
    const renameBtn = contextMenu.locator('button', { hasText: 'Rename' });
    await renameBtn.click();
    await page.waitForTimeout(300);

    // An input should appear
    const input = page.locator('.gc-toolbar-content input');
    await expect(input).toBeVisible();

    // Clear and type new name
    await input.fill('My BUY Filter');
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Verify the button now has the new label
    const updatedBtn = filterButtons(page).first();
    const title = await updatedBtn.getAttribute('title');
    expect(title).toContain('My BUY Filter');
  });

  test('remove deletes button', async ({ page }) => {
    // Set a filter and capture
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });
    await switchToFilters(page);
    await clickAddFilter(page);

    expect(await getFilterButtonCount(page)).toBe(1);

    // Right-click and choose Remove
    const btn = filterButtons(page).first();
    await btn.click({ button: 'right' });
    await page.waitForTimeout(300);

    const contextMenu = page.locator('.fixed.z-\\[10010\\]');
    const removeBtn = contextMenu.locator('button', { hasText: 'Remove' });
    await removeBtn.click();
    await page.waitForTimeout(300);

    // Button should be gone
    expect(await getFilterButtonCount(page)).toBe(0);
  });

  test('save persists across reload', async ({ page }) => {
    // Set a filter and capture
    await setFilterViaApi(page, {
      side: { filterType: 'set', values: ['BUY'] },
    });
    await switchToFilters(page);
    await clickAddFilter(page);

    expect(await getFilterButtonCount(page)).toBe(1);

    // Click Save button (last button with Save icon in toolbar content)
    const saveBtn = page.locator('.gc-toolbar-content button').last();
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Verify localStorage
    const hasSaved = await page.evaluate(() => {
      return localStorage.getItem('gc-filters:demo-blotter') !== null;
    });
    expect(hasSaved).toBe(true);

    // Reload and verify persistence
    await page.reload();
    await waitForGrid(page);
    await switchToFilters(page);

    expect(await getFilterButtonCount(page)).toBe(1);
  });
});
