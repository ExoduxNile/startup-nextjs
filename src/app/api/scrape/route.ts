import { InstagramScraper } from '@/services/instagramScraper'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    const scraper = new InstagramScraper()
    const data = await scraper.scrapeProfile(username)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed' },
      { status: 500 }
    )
  }
}
