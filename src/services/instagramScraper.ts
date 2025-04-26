// src/services/instagramScraper.ts
import puppeteer, { Browser } from 'puppeteer';
import { InstagramProfile } from '@/types/instascrap';

export class InstagramScraper {
    private browser: Browser | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    public async scrapeProfile(username: string): Promise<InstagramProfile> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(`https://www.instagram.com/${username}/`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for the profile elements to load
        await page.waitForSelector('header section', { timeout: 10000 });

        const profileData = await page.evaluate(() => {
            const getMetaContent = (property: string) => {
                const element = document.querySelector(`meta[property="${property}"]`);
                return element ? element.getAttribute('content') : null;
            };

            const description = getMetaContent('og:description');
            let followers = '0';
            let bio = '';

            // Extract followers and bio from description
            if (description) {
                const followersMatch = description.match(/([\d,]+)\s+Followers/);
                followers = followersMatch ? followersMatch[1].replace(/,/g, '') : '0';
                bio = description.split(' - ')[1] || '';
            }

            // Try to get contact info from bio
            const contactInfo = {
                email: bio.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)?.[0] || '',
                phone: bio.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/gi)?.[0] || ''
            };

            return {
                username: window.location.pathname.split('/')[1],
                bio,
                followers,
                ...contactInfo
            };
        });

        await page.close();

        return profileData;
    }

    public async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
