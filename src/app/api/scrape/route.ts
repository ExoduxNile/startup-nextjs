import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    
    // Configure Puppeteer for Vercel
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    })

    const page = await browser.newPage()
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    })

    // Your scraping logic here...
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

    await browser.close()
    
    return NextResponse.json({ success: true, data: profileData })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
