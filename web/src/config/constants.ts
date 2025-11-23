// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cloudflare-worker-backend-api.jp024556.workers.dev';

// File Upload Limits
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
export const MAX_FILES = parseInt(import.meta.env.VITE_MAX_FILES) || 50;
export const MAX_TOTAL_SIZE = parseInt(import.meta.env.VITE_MAX_TOTAL_SIZE) || 100 * 1024 * 1024; // 100MB

// Upload Configuration
export const CHUNK_SIZE = parseInt(import.meta.env.VITE_CHUNK_SIZE) || 1024 * 1024; // 1MB
export const MAX_CONCURRENT_UPLOADS = parseInt(import.meta.env.VITE_MAX_CONCURRENT_UPLOADS) || 3;

// File Expiry
export const FILE_EXPIRY_DAYS = parseInt(import.meta.env.VITE_FILE_EXPIRY_DAYS) || 7;

// Refresh Intervals
export const CONTACTS_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_CONTACTS_REFRESH_INTERVAL) || 60000; // 1 minute

// UI Configuration
export const ITEMS_PER_PAGE = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 20;
export const CONTACTS_PER_PAGE = parseInt(import.meta.env.VITE_CONTACTS_PER_PAGE) || 15;