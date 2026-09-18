import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  // Save Dashboard screenshot
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'public/screenshots/dashboard.png' });
  console.log('Saved dashboard.png');

  // Go to POS screen
  console.log('Navigating to POS...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'public/screenshots/pos.png' });
  console.log('Saved pos.png');

  // Go to Settings screen
  console.log('Navigating to Settings...');
  await page.goto('http://localhost:5173/admin/settings');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'public/screenshots/settings.png' });
  console.log('Saved settings.png');

  await browser.close();
  console.log('Done.');
})();
