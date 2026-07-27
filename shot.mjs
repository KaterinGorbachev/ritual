import { chromium } from "playwright-core";

const OUT = process.argv[2] || "services.png";
const url = "http://localhost:3000/en/services";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
// Let bubble canvas + fonts settle.
await page.waitForTimeout(1500);

// Full page for the whole layout.
await page.screenshot({ path: OUT, fullPage: true });

// Also a focused shot of the first category card grid.
const grid = page.locator('[data-testid="service-item-card"]').first();
if (await grid.count()) {
  const section = page.locator("section[data-cat-id]").first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await section.screenshot({ path: OUT.replace(/\.png$/, "-grid.png") });
}

// Report the first card's Book link href to confirm the wa.me auto-message.
const href = await page
  .locator('[data-testid="service-item-card-book"]')
  .first()
  .getAttribute("href");
console.log("first Book href:", href);
console.log("card count:", await page.locator('[data-testid="service-item-card"]').count());

await browser.close();
