// lib/scraper.ts

import puppeteer from 'puppeteer-core';

export async function scrapeInstagramProfile(username: string) {
  if (!process.env.BROWSERLESS_WS_URL) {
    throw new Error('BROWSERLESS_WS_URL is not defined');
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: process.env.BROWSERLESS_WS_URL,
  });

  try {
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded' });

    const profile = await page.evaluate(() => {
      const getText = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() : '';
      };

      const bio = getText('section > main > div > header > section > div.-vDIg > span');
      const followers = getText('section > main > div > header > section > ul li:nth-child(2) span');
      const username = getText('section > main > div > header > section > h2') || '';

      return {
        username,
        bio,
        followers,
        email: '',
        phone: '',
      };
    });

    return profile;
  } catch (error) {
    console.error('Error scraping profile:', error);
    return null;
  } finally {
    await browser.disconnect();
  }
}
