// src/server.ts
import express from 'express';
import cors from 'cors';
import { scrapeProfile } from './controllers/instagramController';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', scrapeProfile);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
