// src/types/instascrap.ts
export interface InstagramProfile {
    username: string;
    bio: string;
    followers: string;
    email?: string;
    phone?: string;
}

export interface ScrapeRequest {
    username: string;
}

export interface ScrapeResponse {
    success: boolean;
    data?: InstagramProfile;
    error?: string;
}
