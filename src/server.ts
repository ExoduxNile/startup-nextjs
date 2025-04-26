// src/server.ts
import express from 'express';
import cors from 'cors';
import { scrapeProfile } from './controllers/instagramController';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/scrape', scrapeProfile);

// Export the Express app for Vercel to handle
export default app;
