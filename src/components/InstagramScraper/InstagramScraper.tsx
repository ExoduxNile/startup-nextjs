// src/components/InstagramScraper.tsx
"use client";
import axios from 'axios';
import { InstagramProfile } from '@/types/instascrap';
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const InstagramScraper: React.FC = () => {
    const [username, setUsername] = useState('');
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScrape = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/scrape', { username });
            if (response.data.success) {
                setProfile(response.data.data);
            } else {
                setError(response.data.error || 'Failed to scrape profile');
            }
        } catch (err) {
            setError('An error occurred while scraping the profile');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!profile) return;

        const headers = ['Username', 'Bio', 'Followers', 'Email', 'Phone'];
        const values = [
            profile.username,
            `"${profile.bio.replace(/"/g, '""')}"`,
            profile.followers,
            profile.email,
            profile.phone
        ];

        const csvContent = [
            headers.join(','),
            values.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `instagram_${profile.username}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="instagram-scraper">
            <h1>Instagram Profile Scraper</h1>
            <div className="input-group">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Instagram username"
                />
                <button onClick={handleScrape} disabled={loading}>
                    {loading ? 'Scraping...' : 'Scrape Profile'}
                </button>
            </div>
            
            {error && <div className="error">{error}</div>}
            
            {profile && (
                <div className="profile-results">
                    <h2>Profile Information</h2>
                    <div className="profile-details">
                        <p><strong>Username:</strong> {profile.username}</p>
                        <p><strong>Bio:</strong> {profile.bio}</p>
                        <p><strong>Followers:</strong> {profile.followers}</p>
                        {profile.email && <p><strong>Email:</strong> {profile.email}</p>}
                        {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
                    </div>
                    <button onClick={exportToCSV}>Export to CSV</button>
                </div>
            )}
        </div>
    );
};

export default InstagramScraper;
