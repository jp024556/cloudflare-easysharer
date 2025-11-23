import { validateFiles } from '../validation/files.js';
import { createResponse } from '../utils/response.js';
import { corsHeaders } from '../utils/cors.js';
import { getConfig, ALLOWED_MIME_TYPES } from '../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

export async function handleFiles(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    if (path === '/files/upload' && method === 'POST') {
      return await handleFileUpload(request, env);
    } else if (path === '/files/received' && method === 'GET') {
      return await handleGetReceivedFiles(request, env);
    } else if (path === '/files/contacts' && method === 'GET') {
      return await getContacts(env, request);
    } else if (path === '/files/conversation' && method === 'GET') {
      return await getConversationFiles(env, request);
    }

    return createResponse({ error: 'Not Found' }, 404, corsHeaders);
  } catch (error) {
    console.error('File Handler Error:', error);
    return createResponse({ error: 'Internal Server Error' }, 500, corsHeaders);
  }
}

/**
 * Handles requests to get all files received by the current logged-in user.
 * This function expects 'env.userId' to be populated by an authentication middleware.
 * @param {Request} request The incoming HTTP request.
 * @param {Env} env The worker's environment variables (including DB and the authenticated userId).
 * @returns {Response} A JSON response containing the list of received files or an error.
 */
async function handleGetReceivedFiles(request, env) {
  try {
    // The 'authenticate' middleware (from src/middleware.js)
    // should have populated env.userId if the request had a valid JWT.
    const userId = env.userId;

    if (!userId) {
      // If no user ID is found, it means the user is not authenticated,
      // or the authentication middleware failed to populate it.
      return createResponse(
        { error: 'Authentication required to access received files.' },
        401, // Unauthorized
        corsHeaders
      );
    }

    // Query the 'files' table for files where recipient_user_id matches the logged-in user's ID
    const { results } = await env.DB.prepare(
      'SELECT id, sender_mobile_number, file_name, file_size, mime_type, r2_url, created_at FROM files WHERE recipient_user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all();

    // Return the list of files
    return createResponse(
      {
        message: 'Successfully retrieved received files.',
        files: results || [] // Ensure it's an array even if no files are found
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('Get Received Files Error:', error);
    return createResponse({ error: 'Failed to retrieve received files.' }, 500, corsHeaders);
  }
}

// --- Endpoint 1: Get Sender Contacts ---
async function getContacts(env, request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '15', 10);
  const offset = (page - 1) * limit;

  // IMPORTANT: In a real application, recipientUserId would come from
  // an authenticated user's token (e.g., JWT) in the request headers.
  // For this example, we'll hardcode it.
  const recipientUserId = env.userId;

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
    return createResponse({ error: "Invalid 'page' or 'limit' parameters. Must be positive integers." }, 400, corsHeaders);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT
          sender_mobile_number,
          MAX(created_at) AS last_file_timestamp,
          COUNT(*) AS total_files_from_sender
      FROM
          files
      WHERE
          recipient_user_id = ?
      GROUP BY
          sender_mobile_number
      ORDER BY
          last_file_timestamp DESC
      LIMIT
          ? OFFSET ?;
    `)
      .bind(recipientUserId, limit, offset)
      .all();

    return createResponse({ contacts: results || [] }, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return createResponse({ error: "Failed to fetch contacts." }, 500, corsHeaders);
  }
}

// --- Endpoint 2: Get Files for a Specific Sender/Recipient Pair ---
async function getConversationFiles(env, request) {
  const url = new URL(request.url);
  const senderMobileNumber = url.searchParams.get('senderMobileNumber');
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const beforeTimestamp = url.searchParams.get('beforeTimestamp');
  const beforeId = url.searchParams.get('beforeId');

  // IMPORTANT: In a real application, recipientUserId would come from
  // an authenticated user's token (e.g., JWT) in the request headers.
  const recipientUserId = env.userId; // Replace with actual user ID from authentication

  if (!senderMobileNumber) {
    return createResponse({ error: "Missing 'senderMobileNumber' parameter." }, 400, corsHeaders);
  }
  if (isNaN(limit) || limit < 1) {
    return createResponse({ error: "Invalid 'limit' parameter. Must be a positive integer." }, 400, corsHeaders);
  }

  let query;
  let params;

  if (beforeTimestamp && beforeId) {
    // Query for loading older files (cursor-based pagination)
    query = `
      SELECT
          id, sender_mobile_number, recipient_user_id, file_name, file_size, mime_type, r2_url, created_at
      FROM
          files
      WHERE
          recipient_user_id = ?
          AND sender_mobile_number = ?
          AND (created_at < ? OR (created_at = ? AND id < ?))
      ORDER BY
          created_at DESC, id DESC
      LIMIT
          ?;
    `;
    params = [recipientUserId, senderMobileNumber, beforeTimestamp, beforeTimestamp, beforeId, limit];
  } else {
    // Initial query or first page load (get newest files)
    query = `
      SELECT
          id, sender_mobile_number, recipient_user_id, file_name, file_size, mime_type, r2_url, created_at
      FROM
          files
      WHERE
          recipient_user_id = ? AND sender_mobile_number = ?
      ORDER BY
          created_at DESC, id DESC
      LIMIT
          ?;
    `;
    params = [recipientUserId, senderMobileNumber, limit];
  }

  try {
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return createResponse({ files: results }, 200, corsHeaders);
  } catch (error) {
    console.error("Error fetching conversation files:", error);
    return createResponse({ error: "Failed to fetch conversation files." }, 500, corsHeaders);
  }
}

async function handleFileUpload(request, env) {
  try {
    const config = getConfig(env);
    const formData = await request.formData();

    const senderMobileNumber = formData.get('senderMobileNumber');
    const recipientId = formData.get('recipientId');
    const files = formData.getAll('files');

    // Validate input
    const validation = validateFiles.upload({
      senderMobileNumber,
      recipientId,
      files
    });

    if (!validation.success) {
      return createResponse(
        { error: 'Invalid input data', details: validation.error.errors },
        400,
        corsHeaders
      );
    }

    // Validate recipient exists
    const recipient = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
      .bind(recipientId).first();

    if (!recipient) {
      return createResponse(
        { error: 'Recipient ID not found', details: 'The specified recipient does not exist' },
        400,
        corsHeaders
      );
    }

    // Validate file count
    if (files.length > config.MAX_FILES_PER_REQUEST) {
      return createResponse(
        {
          error: 'Too many files uploaded',
          details: `Maximum ${config.MAX_FILES_PER_REQUEST} files allowed per request.`
        },
        400,
        corsHeaders
      );
    }

    // Process files
    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > config.MAX_FILE_SIZE) {
        return createResponse(
          {
            error: 'File size exceeds limit',
            details: `File ${file.name} is too large. Maximum size is ${Math.round(config.MAX_FILE_SIZE / 1024 / 1024)}MB`
          },
          400,
          corsHeaders
        );
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return createResponse(
          {
            error: 'Unsupported file type',
            details: `File ${file.name} has unsupported type. Only images and documents are allowed.`
          },
          400,
          corsHeaders
        );
      }

      try {
        // Upload to R2
        const fileId = uuidv4();
        const r2Key = `files/${senderMobileNumber}/${recipientId}/${fileId}/${file.name}`;

        await env.BUCKET.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        // Generate file URL using configured R2_URL
        const fileUrl = `${config.R2_URL}/${r2Key}`;

        // Save metadata to D1
        const createdAt = new Date().toISOString();
        await env.DB.prepare(
          'INSERT INTO files (id, sender_mobile_number, recipient_user_id, file_name, file_size, mime_type, r2_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(fileId, senderMobileNumber, recipientId, file.name, file.size, file.type, fileUrl, createdAt).run();

        uploadedFiles.push({
          fileId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          url: fileUrl
        });

      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return createResponse(
          { error: 'File upload failed', details: `Failed to upload ${file.name}` },
          500,
          corsHeaders
        );
      }
    }

    return createResponse(
      {
        message: 'Files uploaded successfully',
        uploadedFiles,
        totalFiles: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.fileSize, 0)
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('File Upload Handler Error:', error);
    return createResponse({ error: 'File upload failed' }, 500, corsHeaders);
  }
}