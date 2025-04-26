// lib/scraper.ts
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

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

    // Initialize Chromium
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar'
      ),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    
    // Set longer default timeout
    page.setDefaultTimeout(15000);

    const response = await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Check for error pages
    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.status()}`);
    }

    // Check for login/age gate
    const isLoginWall = await page.$('input[name="username"]');
    if (isLoginWall) {
      throw new Error('Instagram is showing login/age verification wall');
    }

    // Try multiple selectors with fallbacks
    let profileData;
    try {
      // Wait for either the modern or legacy profile selector
      await Promise.race([
        page.waitForSelector('header section, main header, .x7a106z', { timeout: 10000 }),
        page.waitForSelector('meta[property="og:description"]', { timeout: 10000 })
      ]);

      profileData = await page.evaluate((): InstagramProfile => {
        // Modern selector fallback
        const getFromMeta = () => {
          const meta = document.querySelector('meta[property="og:description"]');
          if (!meta) return null;
          
          const content = meta.getAttribute('content') || '';
          const followersMatch = content.match(/([\d,]+)\s+Followers/);
          const bio = content.split(' - ')[1] || '';
          
          return {
            followers: followersMatch ? followersMatch[1].replace(/,/g, '') : '0',
            bio,
            email: bio.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)?.[0] || '',
            phone: bio.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/gi)?.[0] || ''
          };
        };

        // Try modern DOM first
        const header = document.querySelector('header section, main header, .x7a106z');
        if (header) {
          const usernameEl = header.querySelector('h1, h2');
          const stats = Array.from(header.querySelectorAll('ul li span span'));
          
          return {
            username: usernameEl?.textContent?.trim() || 'N/A',
            posts: stats[0]?.textContent?.trim() || 'N/A',
            followers: stats[1]?.textContent?.trim() || 'N/A',
            ...getFromMeta() || {}
          };
        }

        // Fallback to meta tags
        const metaData = getFromMeta();
        if (metaData) {
          return {
            username: window.location.pathname.split('/')[1],
            posts: 'N/A',
            ...metaData
          };
        }

        throw new Error('Could not find profile data');
      });
    } catch (e) {
      console.warn('Primary scraping method failed, trying fallback...');
      // Fallback to meta tag scraping
      const metaContent = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content'));
      if (!metaContent) throw new Error('Profile data not found');

      const followersMatch = metaContent.match(/([\d,]+)\s+Followers/);
      const bio = metaContent.split(' - ')[1] || '';

      profileData = {
        username,
        followers: followersMatch ? followersMatch[1].replace(/,/g, '') : '0',
        bio,
        email: bio.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)?.[0] || '',
        phone: bio.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/gi)?.[0] || ''
      };
    }

    console.log('✅ Data Scraped:', profileData);

    if (profileData.username === 'N/A') {
      return { 
        username,
        followers: '0',
        error: 'Could not fetch data, profile may be private or unavailable' 
      };
    }

    return profileData;
  } catch (error) {
    console.error('🚨 Scraping Error:', error instanceof Error ? error.message : String(error));
    return { 
      username,
      followers: '0',
      error: error instanceof Error ? error.message : 'Failed to scrape profile'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
