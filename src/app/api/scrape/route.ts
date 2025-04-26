// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeInstagramProfile } from '@/lib/scraper';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid username' }, 
        { status: 400 }
      );
    }

    const profile = await scrapeInstagramProfile(username);

    if (!profile || profile.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: profile?.error || 'Profile not found or scraping failed' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: profile 
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}
