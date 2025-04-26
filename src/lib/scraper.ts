// lib/scraper.ts
import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

interface InstagramProfile {
  username: string;
  bio: string;
  followers: string;
  email: string;
  phone: string;
}

export const scrapeInstagramProfile = async (username: string): Promise<InstagramProfile | null> => {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath || process.env.CHROME_EXECUTABLE_PATH,
      headless: chrome.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    return await page.evaluate((): InstagramProfile => {
      const getMetaContent = (property: string): string | null => {
        const element = document.querySelector(`meta[property="${property}"]`);
        return element ? element.getAttribute('content') : null;
      };

      const description = getMetaContent('og:description');
      let followers = '0';
      let bio = '';

      if (description) {
        const followersMatch = description.match(/([\d,]+)\s+Followers/);
        followers = followersMatch ? followersMatch[1].replace(/,/g, '') : '0';
        bio = description.split(' - ')[1] || '';
      }

      return {
        username: window.location.pathname.split('/')[1],
        bio,
        followers,
        email: bio.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)?.[0] || '',
        phone: bio.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/gi)?.[0] || ''
      };
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
