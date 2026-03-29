import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';

test('authenticated lead board drag and drop works without console errors', async ({
  page,
}) => {
  test.setTimeout(90000);

  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(`${BASE_URL}/en/auth/login`, {
    waitUntil: 'networkidle',
  });

  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => url.pathname.includes('/dashboard'), {
    timeout: 20000,
  });

  await page.getByRole('link', { name: /leads/i }).click();
  await page.waitForURL((url) => url.pathname.includes('/dashboard/leads'), {
    timeout: 30000,
  });

  const boardTab = page.getByRole('tab', { name: /board|pano|لوحة/i }).first();
  await boardTab.click();

  await page.waitForSelector('[data-rfd-droppable-id]', { timeout: 20000 });
  await page.waitForSelector('[data-rfd-draggable-id]', { timeout: 20000 });

  const dragData = await page.evaluate(() => {
    const card = document.querySelector('[data-rfd-draggable-id]');
    if (!card) {
      return { ok: false, reason: 'no-card' };
    }

    const sourceColumn = card.closest('[data-rfd-droppable-id]');
    if (!sourceColumn) {
      return { ok: false, reason: 'no-source-column' };
    }

    const columns = Array.from(
      document.querySelectorAll('[data-rfd-droppable-id]')
    );
    const targetColumn = columns.find((column) => column !== sourceColumn);

    if (!targetColumn) {
      return { ok: false, reason: 'no-target-column' };
    }

    const cardRect = card.getBoundingClientRect();
    const targetRect = targetColumn.getBoundingClientRect();

    return {
      ok: true,
      cardId: card.getAttribute('data-rfd-draggable-id'),
      sourceId: sourceColumn.getAttribute('data-rfd-droppable-id'),
      targetId: targetColumn.getAttribute('data-rfd-droppable-id'),
      from: {
        x: cardRect.left + cardRect.width / 2,
        y: cardRect.top + Math.min(24, cardRect.height / 2),
      },
      to: {
        x: targetRect.left + Math.min(targetRect.width / 2, 120),
        y: targetRect.top + 120,
      },
    };
  });

  expect(dragData.ok, dragData.reason || 'drag setup failed').toBeTruthy();

  await page.mouse.move(dragData.from.x, dragData.from.y);
  await page.mouse.down();
  await page.mouse.move(dragData.to.x, dragData.to.y, { steps: 12 });
  await page.mouse.up();

  await page.waitForTimeout(1000);

  const after = await page.evaluate((cardId) => {
    const card = document.querySelector(`[data-rfd-draggable-id="${cardId}"]`);
    if (!card) {
      return { found: false, columnId: null };
    }

    const parentColumn = card.closest('[data-rfd-droppable-id]');
    return {
      found: true,
      columnId: parentColumn?.getAttribute('data-rfd-droppable-id') ?? null,
    };
  }, dragData.cardId);

  expect(after.found).toBeTruthy();
  expect(after.columnId).toBe(dragData.targetId);
  expect(consoleErrors).toEqual([]);
});
