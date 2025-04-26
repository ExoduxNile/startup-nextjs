// lib/scraper.ts
import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

interface InstagramProfile {
  username: string;
  posts?: string;
  followers: string;
  bio?: string;
  email?: string;
  phone?: string;
  error?: string;
}

export const scrapeInstagramProfile = async (username: string): Promise<InstagramProfile | null> => {
  let browser = null;
  
  try {
    console.log(`🚀 Scraping Instagram profile: ${username}`);

    browser = await puppeteer.launch({
      args: [...chrome.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chrome.executablePath || process.env.CHROME_EXECUTABLE_PATH,
      headless: chrome.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Wait for profile data to load
    await page.waitForSelector('header section', { timeout: 5000 });

    const data = await page.evaluate((): InstagramProfile => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() || 'N/A' : 'N/A';
      };

      const getStats = () => {
        const stats = document.querySelectorAll('ul li span span');
        return {
          posts: stats[0]?.textContent?.trim() || 'N/A',
          followers: stats[1]?.textContent?.trim() || 'N/A',
        };
      };

      const getBio = (): string => {
        const bioEl = document.querySelector('header section div:last-child');
        return bioEl?.textContent?.trim() || '';
      };

      const bio = getBio();
      
      return {
        username: getText('header section h2, header section h1'),
        ...getStats(),
        bio,
        email: bio.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)?.[0] || '',
        phone: bio.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/gi)?.[0] || ''
      };
    });

    console.log('✅ Data Scraped:', data);

    if (data.username === 'N/A') {
      return { 
        username,
        followers: '0',
        error: 'Could not fetch data, profile may be private or unavailable' 
      };
    }

    return data;
  } catch (error) {
    console.error('🚨 Puppeteer Error:', error instanceof Error ? error.message : String(error));
    return { 
      username,
      followers: '0',
      error: 'Failed to scrape data' 
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
