import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
const failedRequests = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push('Console: ' + msg.text());
  }
});

page.on('pageerror', error => {
  errors.push('Page Error: ' + error.message);
  console.log('Full error:', error.stack || error.message);
});

page.on('requestfailed', request => {
  failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText
  });
});

page.on('response', response => {
  if (response.status() >= 400) {
    failedRequests.push({
      url: response.url(),
      status: response.status()
    });
  }
});

console.log('Navigating to https://agent-flywheel.com/ ...');
try {
  await page.goto('https://agent-flywheel.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('\n=== PAGE SCRIPTS ===');
  const scripts = await page.locator('script[src]').all();
  for (const script of scripts) {
    const src = await script.getAttribute('src');
    console.log('Script:', src);
  }

} catch (e) {
  console.log('Navigation error:', e.message);
}

if (failedRequests.length > 0) {
  console.log('\n=== FAILED REQUESTS ===');
  failedRequests.forEach(r => console.log(JSON.stringify(r)));
}

if (errors.length > 0) {
  console.log('\n=== JS ERRORS ===');
  errors.forEach(e => console.log(e));
}

await browser.close();
