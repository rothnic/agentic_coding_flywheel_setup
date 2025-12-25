import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push('Console Error: ' + msg.text());
  }
});

page.on('pageerror', error => {
  errors.push('Page Error: ' + error.message);
});

console.log('Navigating to https://agent-flywheel.com/learn...');
try {
  await page.goto('https://agent-flywheel.com/learn', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Page title:', title);

  const heading = await page.locator('h1').first().textContent();
  console.log('Main heading:', heading);

} catch (e) {
  console.log('Navigation error:', e.message);
}

if (errors.length > 0) {
  console.log('\n=== ERRORS FOUND ===');
  errors.forEach(e => console.log(e));
} else {
  console.log('\nNo JS errors detected');
}

await browser.close();
