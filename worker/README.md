# Cloudflare Worker Backend

A robust and scalable backend API built with Cloudflare Workers for user management and file handling.

## Features

### Authentication API
- **POST /auth/register** - User registration with email and password
- **POST /auth/login** - User authentication with JWT
- **POST /auth/logout** - Session termination
- **POST /auth/forgot-password** - Password reset email
- **POST /auth/reset-password** - Password reset with token
- **POST /auth/change-password** - Password change for authenticated users

### File Upload API
- **POST /files/upload** - Upload files to Cloudflare R2 with metadata storage

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Cloudflare Services

#### D1 Database Setup
```bash
# Create D1 database
wrangler d1 create fileshare

# Update wrangler.toml with your database ID
# Run schema migrations
wrangler d1 execute fileshare --file=schema.sql
```

#### R2 Bucket Setup
```bash
# Create R2 bucket
wrangler r2 bucket create fileshare-bucket
```

### 3. Set Environment Variables
```bash
# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
wrangler secret put SENDER_EMAIL
```

### 4. Development
```bash
# Start development server
npm run dev
```

### 5. Deploy
```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mobileNumber": "9876543210"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>
```

#### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

#### Change Password
```
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass123!"
}
```

### File Upload Endpoint

#### Upload Files
```
POST /files/upload
Content-Type: multipart/form-data

senderMobileNumber: 9876543210
recipientId: user-uuid
files: [file1, file2, ...]
```

### Get received files
```
GET /files/received
Authorization: Bearer <token>
Content-Type: application/json

## Security Features

- Password hashing with bcrypt
- JWT authentication with expiration
- Rate limiting protection
- Input validation with Zod
- CORS configuration
- SQL injection prevention
- File type validation
- File size limits

## File Storage

- Files are stored in Cloudflare R2
- Metadata is stored in Cloudflare D1
- Automatic file organization by sender/recipient
- Public URL generation for file access

## Rate Limiting

- Configurable rate limits per IP
- Protection against brute force attacks
- Automatic request throttling

## Error Handling

- Comprehensive error responses
- Detailed logging
- User-friendly error messages
- Proper HTTP status codes

## Environment Variables

- `JWT_SECRET` - Secret key for JWT signing
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password/API key
- `SENDER_EMAIL` - Email address for sending emails
- `R2_URL` - Base URL for R2 bucket access

## Database Schema

The application uses four main tables:
- `users` - User account information
- `password_reset_tokens` - Password reset tokens
- `files` - File metadata and storage references
- `token_blacklist` - Optional token revocation

## Deployment

The worker is configured to deploy to Cloudflare Workers with:
- D1 database binding
- R2 bucket binding
- Environment variables and secrets
- CORS configuration
- Rate limiting