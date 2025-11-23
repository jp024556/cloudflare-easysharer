-- Cloudflare D1 Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mobile_number TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  sender_mobile_number TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  r2_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_recipient ON files(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_files_sender ON files(sender_mobile_number);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at);

-- Token blacklist table (optional for enhanced security)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blacklist_token ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON token_blacklist(expires_at);

-- Add tables for chunked upload support

-- Upload sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  sender_mobile_number TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  chunk_size INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated', -- initiated, uploading, completed, failed, aborted
  file_id TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- Upload chunks table
CREATE TABLE IF NOT EXISTS upload_chunks (
  id TEXT PRIMARY KEY,
  upload_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  chunk_hash TEXT,
  r2_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (upload_id) REFERENCES upload_sessions(id) ON DELETE CASCADE,
  UNIQUE(upload_id, chunk_index)
);

-- Add file_hash column to files table
ALTER TABLE files ADD COLUMN file_hash TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_recipient ON upload_sessions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created ON upload_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_upload_id ON upload_chunks(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_index ON upload_chunks(upload_id, chunk_index);

-- Step 1: Add the new column 'short_code' to the 'users' table.
-- It will be TEXT and NULLABLE by default.
-- DO NOT include the UNIQUE constraint in this ADD COLUMN statement.
ALTER TABLE users
ADD COLUMN short_code TEXT;

-- Step 2: Create a UNIQUE index on the 'short_code' column.
-- This enforces uniqueness for all NON-NULL values.
-- SQLite's UNIQUE index allows multiple NULL values, which is typically
-- the desired behavior for an optional shortcode.
-- The 'IF NOT EXISTS' clause prevents errors if the index already exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_short_code ON users (short_code);

ALTER TABLE users ADD COLUMN name TEXT;