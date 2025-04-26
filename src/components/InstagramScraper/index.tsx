"use client";
import axios from 'axios';
import { InstagramProfile } from '@/types/instascrap';
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import React, { useState } from 'react';

const InstagramScraper: React.FC = () => {
    const [username, setUsername] = useState('');
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    const handleScrape = async () => {
        // Validate input
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setError('Please enter a valid Instagram username');
            return;
        }

        // Reset states
        setLoading(true);
        setError('');
        setProfile(null);

        try {
            // Add a small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));

            const response = await axios.post('/api/scrape', { 
                username: trimmedUsername 
            }, {
                timeout: 15000,
                validateStatus: (status) => status < 500
            });

            if (response.status === 200 && response.data?.success) {
                setProfile(response.data.data);
                
                const history = JSON.parse(localStorage.getItem('scrapeHistory') || '[]');
                localStorage.setItem('scrapeHistory', 
                    JSON.stringify([...history, {
                        username: trimmedUsername,
                        timestamp: new Date().toISOString(),
                        data: response.data.data
                    }].slice(-10))
                );
            } else {
                const errorMessage = response.data?.error || 
                                   response.statusText || 
                                   'Failed to scrape profiles';
                setError(errorMessage);
                
                if (response.status === 429) {
                    setError('Too many requests. Please try again later.');
                }
            }
        } catch (err) {
            let errorMsg = 'An error occurred while scraping the profile';
            
            if (axios.isAxiosError(err)) {
                if (err.code === 'ECONNABORTED') {
                    errorMsg = 'Request timed out. Instagram may be slow to respond.';
                } else if (err.response) {
                    errorMsg = `Server error: ${err.response.status}`;
                } else if (err.request) {
                    errorMsg = 'Network error. Please check your connection.';
                }
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            console.error('Scraping error:', err);
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
            profile.email || '',
            profile.phone || ''
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
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`instagram-scraper p-6 rounded-lg shadow-lg ${
                theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}
        >
            <h1 className="text-2xl font-bold mb-4">Instagram Profile Scraper</h1>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Instagram username"
                    className="flex-1 px-4 py-2 border rounded"
                />
                <button 
                    onClick={handleScrape} 
                    disabled={loading}
                    className={`px-4 py-2 rounded ${
                        loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Scraping...
                        </span>
                    ) : 'Scrape Profile'}
                </button>
            </div>
            
            {error && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 mb-4 text-red-600 bg-red-100 rounded"
                >
                    {error}
                </motion.div>
            )}
            
            {profile && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 border rounded"
                >
                    <h2 className="text-xl font-semibold mb-3">Profile Information</h2>
                    <div className="space-y-2">
                        <p><strong>Username:</strong> {profile.username}</p>
                        <p><strong>Bio:</strong> {profile.bio}</p>
                        <p><strong>Followers:</strong> {profile.followers}</p>
                        {profile.email && <p><strong>Email:</strong> {profile.email}</p>}
                        {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Export to CSV
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

export default InstagramScraper;
