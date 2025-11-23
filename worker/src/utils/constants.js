// Configuration constants derived from environment variables
export function getConfig(env) {
  return {
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: parseInt(env.RATE_LIMIT_WINDOW_MS) || 60000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(env.RATE_LIMIT_MAX_REQUESTS) || 60,

    // File upload limits
    MAX_FILE_SIZE: parseInt(env.MAX_FILE_SIZE) || 10485760, // 10MB
    MAX_FILES_PER_REQUEST: parseInt(env.MAX_FILES_PER_REQUEST) || 50,

    // Chunked upload settings
    DEFAULT_CHUNK_SIZE: parseInt(env.DEFAULT_CHUNK_SIZE) || 1048576, // 1MB
    MAX_CHUNK_SIZE: parseInt(env.MAX_CHUNK_SIZE) || 5242880, // 5MB
    UPLOAD_SESSION_TIMEOUT_HOURS: parseInt(env.UPLOAD_SESSION_TIMEOUT_HOURS) || 24,

    // JWT configuration
    JWT_EXPIRES_IN: `${env.JWT_EXPIRES_IN || 3600}s`,

    // Password reset
    RESET_TOKEN_EXPIRES_MINUTES: parseInt(env.RESET_TOKEN_EXPIRES_MINUTES) || 15,

    // URLs
    R2_URL: env.R2_URL,
    FRONTEND_URL: env.FRONTEND_URL,

    // AWS
    AWS_REGION: env.AWS_REGION,

    // Email
    SENDER_EMAIL: env.SENDER_EMAIL
  };
}

// Allowed MIME types for file uploads
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
  // Documents
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];