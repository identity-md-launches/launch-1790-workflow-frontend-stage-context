// Run from the repository root. All RPC and wallet requests use the existing fixture.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const checkWeb = process.env.WEIR_CHECK_WEB || resolve('web');
const req = createRequire(resolve(checkWeb, 'package.json'));
const { chromium, webkit } = req('playwright');
const { expect } = req('@playwright/test');
const { installMock, newState } = await import(pathToFileURL(resolve(checkWeb, 'tests/mock-chain.mjs')));
const { serve } = await import(pathToFileURL(resolve('web/tests/server.mjs')));
const before = process.argv.includes('--record-before');
const phase = before ? 'before' : 'after';
const out = resolve('test/scratch/wallet-layout', phase);
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const report = { phase, engines: [], checks: [] };
const routes = ['/', '/create', '/streams', '/records', '/stream/1', '/stream/1/receipt/client', '/stream/1/receipt/freelancer'];

async function dimensions(page) {
  return page.evaluate(() => {
    const box = el => {
      if (!el) return null;
      const { x, y, width, height, right, bottom } = el.getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    const visible = selector => [...document.querySelectorAll(selector)].find(el => el.getClientRects().length);
    const button = visible('.wallet-button');
    const error = visible('.wallet-error');
    const nav = visible('nav[aria-label="Main navigation"]');
    return {
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      button: box(button), label: button?.innerText,
      error: box(error), errorText: error?.innerText,
      errorPosition: error && getComputedStyle(error).position,
      nav: box(nav),
      links: [...nav.querySelectorAll('a')].map(a => {
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { text: a.innerText, centerInViewport: r.x + r.width / 2 < innerWidth, reachable: hit === a || a.contains(hit), hit: hit?.className };
      }),
    };
  });
}

async function open(page, route) {
  await page.goto(`${url}#${route}`);
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
}

async function measure(page, row, route) {
  const d = await dimensions(page);
  row.measurements.push({ route, ...d });
  if (!before) {
    expect(d.document, `${row.name} ${route}`).toBeLessThanOrEqual(d.viewport);
    expect(d.button.x).toBeGreaterThanOrEqual(0);
    expect(d.button.right).toBeLessThanOrEqual(d.viewport + 0.1);
    // At 320px the approved home nav pans internally. Clicking Records below
    // also checks that Playwright can scroll that link into view and activate it.
    expect(d.links.filter(l => l.centerInViewport).every(l => l.reachable)).toBe(true);
    if (d.error && row.width <= 640) {
      expect(d.errorPosition).toBe('static');
      expect(d.error.y).toBeGreaterThanOrEqual(d.button.bottom);
      expect(d.error.bottom).toBeLessThanOrEqual(d.nav.y);
      expect(d.error.x).toBe(16);
      expect(d.error.width).toBe(row.width - 32);
    }
  }
}

async function run(browser, engine, width, name, inject, test) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const row = { engine, width, name, measurements: [], pageErrors: [], failedAssets: [], externalAssets: [] };
  const state = newState();
  for (const s of state.streams.values()) s.termsURI = 'Deliver the agreed work.';
  // The no-wallet test keeps the public RPC mock but deliberately skips provider injection.
  await installMock(inject ? page : {
    route: page.route.bind(page),
    exposeFunction: page.exposeFunction.bind(page),
    addInitScript: async () => {},
  }, state);
  page.on('pageerror', e => row.pageErrors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) row.failedAssets.push(r.url()); });
  page.on('request', r => {
    if (['script', 'stylesheet', 'font', 'image'].includes(r.resourceType()) && !r.url().startsWith(url) && !r.url().startsWith('data:')) row.externalAssets.push(r.url());
  });
  try {
    await test(page, state, row);
    expect(state.transactions).toEqual([]);
    expect(row.pageErrors).toEqual([]);
    expect(row.failedAssets).toEqual([]);
    expect(row.externalAssets).toEqual([]);
    row.passed = true;
    console.log('PASS', phase, engine, width, name);
  } catch (e) {
    row.passed = false;
    row.failure = e.message;
    console.log('FAIL', phase, engine, width, name, e.message);
  } finally {
    report.checks.push(row);
    await context.close();
  }
}

try {
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    let browser;
    try {
      browser = await launcher.launch({ headless: true });
      report.engines.push({ engine, version: browser.version() });
    } catch (e) {
      report.engines.push({ engine, unavailable: e.message });
      console.log('UNAVAILABLE', engine, e.message);
      continue;
    }
    try {
      for (const width of before ? [360, 390] : [320, 360, 390, 640, 900, 1440]) {
        await run(browser, engine, width, 'wrong-network', true, async (page, state, row) => {
          state.rejectSwitch = true;
          await open(page, '/');
          await page.locator('.wallet-button:visible').click();
          await page.getByRole('button', { name: 'Test browser wallet', exact: true }).click();
          await expect(page.locator('dialog [role="alert"]')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(page.getByRole('dialog')).toHaveCount(0);
          await expect(page.locator('.wallet-button:visible')).toContainText('Switch to Robinhood Chain');
          for (const route of routes) {
            await page.evaluate(hash => { location.hash = hash; }, route);
            await expect(page).toHaveURL(`${url}#${route}`);
            await expect(page.locator('main h1:visible')).toHaveCount(1);
            await measure(page, row, route);
            if (width === 360 && ['/', '/create'].includes(route))
              await page.screenshot({ path: resolve(out, `${engine}-${width}-wrong-${route === '/' ? 'home' : 'create'}.png`) });
          }
          state.rejectSwitch = false;
          await page.locator('.wallet-button:visible').click();
          await expect(page.locator('.wallet-button:visible')).not.toContainText('Switch');
          expect(state.walletChain).toBe(4663);
          expect(state.requests.some(r => r.method === 'wallet_switchEthereumChain')).toBe(true);
        });
        // The reported overlapping error is in mobile headers; larger layouts stay unchanged.
        if (width > 900) continue;
        for (const route of ['/', '/create']) {
          await run(browser, engine, width, `no-wallet-${route === '/' ? 'home' : 'create'}`, false, async (page, state, row) => {
            await open(page, route);
            const trigger = page.locator('.wallet-button:visible');
            await trigger.click();
            await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
            await expect(page.locator('dialog [role="alert"]')).toHaveText('No browser wallet was found. Install a wallet, or choose Coinbase Wallet.');
            await page.keyboard.press('Escape');
            await expect(trigger).toBeFocused();
            await measure(page, row, route);
            if (width === 360 || width === 390)
              await page.screenshot({ path: resolve(out, `${engine}-${width}-no-wallet-${route === '/' ? 'home' : 'create'}.png`) });
            try {
              await page.locator('nav:visible').getByRole('link', { name: 'Records', exact: true }).click({ timeout: 1500 });
              await expect(page).toHaveURL(`${url}#/records`);
              row.recordsClick = 'passed';
            } catch (e) {
              row.recordsClick = 'blocked';
              if (!before) throw e;
            }
          });
        }
      }
    } finally { await browser.close(); }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
  await writeFile(resolve(out, 'results.json'), JSON.stringify(report, null, 2) + '\n');
}
if (report.checks.some(r => !r.passed) || !report.checks.length) process.exitCode = 1;
