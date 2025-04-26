// lib/scraper.ts
import puppeteer from 'puppeteer-core';

export async function scrapeInstagramProfile(username: string) {
  if (!username) {
    throw new Error('No username provided');
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
      // Emails and phone numbers aren't public by default. Placeholder for now.
      const email = '';
      const phone = '';

      const username = getText('section > main > div > header > section > h2') || '';

      return {
        username,
        bio,
        followers,
        email,
        phone,
      };
    });

    return profile;
  } catch (error) {
    console.error('Error scraping profile:', error);
    return null;
  } finally {
    await browser.close();
  }
}

