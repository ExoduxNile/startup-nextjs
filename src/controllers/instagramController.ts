// src/controllers/instagramController.ts
import { Request, Response } from 'express';
import { InstagramScraper } from '@/services/instagramScraper';
import { ScrapeResponse } from '@/types/instascrap';

const scraper = new InstagramScraper();

export const scrapeProfile = async (req: Request, res: Response) => {
    const { username } = req.body;
    
    if (!username) {
        const response: ScrapeResponse = {
            success: false,
            error: 'Username is required'
        };
        return res.status(400).json(response);
    }

    try {
        const profileData = await scraper.scrapeProfile(username);
        const response: ScrapeResponse = {
            success: true,
            data: profileData
        };
        res.json(response);
    } catch (error) {
        const response: ScrapeResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to scrape profiless'
        };
        res.status(500).json(response);
    }
};
