// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeInstagramProfile } from '@/lib/scraper'; // I'll show you how to fix this too

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid username' }, { status: 400 });
    }

    const profile = await scrapeInstagramProfile(username);

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found or scraping failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

