import { validateUploads } from '../validation/uploads.js';
import { createResponse } from '../utils/response.js';
import { corsHeaders } from '../utils/cors.js';
import { getConfig, ALLOWED_MIME_TYPES } from '../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

// Import FixedLengthStream from the 'stream' module in Cloudflare Workers
// Note: FixedLengthStream is a global in Workers, but explicit import can be clearer.
// If it's not globally available, you might need a specific import path depending on your setup.
// For standard Workers, it's usually available without explicit import.
// const { FixedLengthStream } = require('stream/web'); // Example for Node.js, not Workers

export async function handleUploads(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
        const routes = {
            'POST /uploads/initiate': () => handleInitiateUpload(request, env),
            'POST /uploads/chunk': () => handleChunkUpload(request, env),
            'POST /uploads/complete': () => handleCompleteUpload(request, env),
            'POST /uploads/abort': () => handleAbortUpload(request, env),
            'GET /uploads/status': () => handleUploadStatus(request, env),
            'POST /uploads/resume': () => handleResumeUpload(request, env)
        };

        const routeKey = `${method} ${path}`;
        const handler = routes[routeKey];

        if (handler) {
            return await handler();
        }

        return createResponse({ error: 'Not Found' }, 404, corsHeaders);
    } catch (error) {
        console.error('Upload Handler Error:', error);
        return createResponse({ error: 'Internal Server Error' }, 500, corsHeaders);
    }
}

async function handleInitiateUpload(request, env) {
    try {
        const body = await request.json();
        const validation = validateUploads.initiate(body);

        if (!validation.success) {
            return createResponse(
                { error: 'Invalid input data', details: validation.error.errors },
                400,
                corsHeaders
            );
        }

        const {
            fileName,
            fileSize,
            mimeType,
            senderMobileNumber,
            recipientId,
            chunkSize = 1024 * 1024 // Default 1MB chunks
        } = validation.data;

        const config = getConfig(env);

        // Validate file size
        if (fileSize > config.MAX_FILE_SIZE) {
            return createResponse(
                {
                    error: 'File size exceeds limit',
                    details: `Maximum file size is ${Math.round(config.MAX_FILE_SIZE / 1024 / 1024)}MB`
                },
                400,
                corsHeaders
            );
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return createResponse(
                {
                    error: 'Unsupported file type',
                    details: 'Only images and documents are allowed.'
                },
                400,
                corsHeaders
            );
        }

        // Validate recipient exists
        const recipient = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
            .bind(recipientId).first();

        if (!recipient) {
            return createResponse(
                { error: 'Recipient ID not found' },
                400,
                corsHeaders
            );
        }

        // Create upload session
        const uploadId = uuidv4();
        const totalChunks = Math.ceil(fileSize / chunkSize);
        const createdAt = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO upload_sessions (
            id, sender_mobile_number, recipient_user_id, file_name,
            file_size, mime_type, chunk_size, total_chunks,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'initiated', ?)
        `).bind(
            uploadId, senderMobileNumber, recipientId, fileName,
            fileSize, mimeType, chunkSize, totalChunks, createdAt
        ).run();

        return createResponse(
            {
                uploadId,
                chunkSize,
                totalChunks,
                message: 'Upload session initiated successfully'
            },
            200,
            corsHeaders
        );

    } catch (error) {
        console.error('Initiate Upload Error:', error);
        return createResponse({ error: 'Failed to initiate upload' }, 500, corsHeaders);
    }
}

async function handleChunkUpload(request, env) {
    try {
        const formData = await request.formData();
        const uploadId = formData.get('uploadId');
        const chunkIndex = parseInt(formData.get('chunkIndex'));
        const chunk = formData.get('chunk'); // This is a File or Blob object
        const chunkHash = formData.get('chunkHash'); // For integrity verification

        const validation = validateUploads.chunk({
            uploadId,
            chunkIndex,
            chunk,
            chunkHash
        });

        if (!validation.success) {
            return createResponse(
                { error: 'Invalid chunk data', details: validation.error.errors },
                400,
                corsHeaders
            );
        }

        // Get upload session
        const session = await env.DB.prepare(
            'SELECT * FROM upload_sessions WHERE id = ? AND status IN ("initiated", "uploading")'
        ).bind(uploadId).first();

        if (!session) {
            return createResponse(
                { error: 'Upload session not found or expired' },
                404,
                corsHeaders
            );
        }

        // Check if chunk already exists
        const existingChunk = await env.DB.prepare(
            'SELECT id FROM upload_chunks WHERE upload_id = ? AND chunk_index = ?'
        ).bind(uploadId, chunkIndex).first();

        if (existingChunk) {
            return createResponse(
                {
                    message: 'Chunk already uploaded',
                    chunkIndex,
                    status: 'duplicate'
                },
                200,
                corsHeaders
            );
        }

        // Validate chunk index
        if (chunkIndex >= session.total_chunks) {
            return createResponse(
                { error: 'Invalid chunk index' },
                400,
                corsHeaders
            );
        }

        // Store chunk in R2
        const chunkKey = `chunks/${uploadId}/${chunkIndex}`;

        try {
            // --- FIX APPLIED HERE ---
            // Wrap the chunk's stream with FixedLengthStream, providing its known size
            const { readable, writable } = new FixedLengthStream(chunk.size);
            chunk.stream().pipeTo(writable); // Pipe the chunk data into the fixed-length stream

            await env.BUCKET.put(chunkKey, readable, { // Use the readable side of FixedLengthStream
                httpMetadata: { contentType: 'application/octet-stream' }
            });

            // Record chunk in database
            const chunkId = uuidv4();
            const uploadedAt = new Date().toISOString();

            await env.DB.prepare(`
              INSERT INTO upload_chunks (
                id, upload_id, chunk_index, chunk_size,
                chunk_hash, r2_key, uploaded_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                chunkId, uploadId, chunkIndex, chunk.size, // Use chunk.size here as well
                chunkHash, chunkKey, uploadedAt
            ).run();

            // Update session status
            await env.DB.prepare(
                'UPDATE upload_sessions SET status = "uploading", updated_at = ? WHERE id = ?'
            ).bind(new Date().toISOString(), uploadId).run();

            // Get upload progress
            const uploadedChunks = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM upload_chunks WHERE upload_id = ?'
            ).bind(uploadId).first();

            const progress = Math.round((uploadedChunks.count / session.total_chunks) * 100);

            return createResponse(
                {
                    message: 'Chunk uploaded successfully',
                    chunkIndex,
                    progress,
                    uploadedChunks: uploadedChunks.count,
                    totalChunks: session.total_chunks,
                    status: 'uploaded'
                },
                200,
                corsHeaders
            );

        } catch (r2Error) {
            console.error('R2 Upload Error:', r2Error);
            return createResponse(
                { error: 'Failed to store chunk' },
                500,
                corsHeaders
            );
        }

    } catch (error) {
        console.error('Chunk Upload Error:', error);
        return createResponse({ error: 'Chunk upload failed' }, 500, corsHeaders);
    }
}

async function handleCompleteUpload(request, env) {
    try {
        const body = await request.json();
        const validation = validateUploads.complete(body);

        if (!validation.success) {
            return createResponse(
                { error: 'Invalid completion data', details: validation.error.errors },
                400,
                corsHeaders
            );
        }

        const { uploadId, fileHash } = validation.data;

        // Get upload session
        const session = await env.DB.prepare(
            'SELECT * FROM upload_sessions WHERE id = ? AND status = "uploading"'
        ).bind(uploadId).first();

        if (!session) {
            return createResponse(
                { error: 'Upload session not found or not ready for completion' },
                404,
                corsHeaders
            );
        }

        // Verify all chunks are uploaded
        const uploadedChunks = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM upload_chunks WHERE upload_id = ?'
        ).bind(uploadId).first();

        if (uploadedChunks.count !== session.total_chunks) {
            return createResponse(
                {
                    error: 'Upload incomplete',
                    details: `Missing chunks. Expected: ${session.total_chunks}, Got: ${uploadedChunks.count}`
                },
                400,
                corsHeaders
            );
        }

        // Assemble file from chunks
        const chunks = await env.DB.prepare(
            'SELECT chunk_index, r2_key FROM upload_chunks WHERE upload_id = ? ORDER BY chunk_index'
        ).bind(uploadId).all();

        try {
            // Create final file key
            const fileId = uuidv4();
            const finalKey = `files/${session.sender_mobile_number}/${session.recipient_user_id}/${fileId}/${session.file_name}`;

            // Combine chunks into final file
            const chunkStreams = [];
            for (const chunk of chunks.results) {
                const chunkObject = await env.BUCKET.get(chunk.r2_key);
                if (!chunkObject) {
                    throw new Error(`Missing chunk: ${chunk.chunk_index}`);
                }
                chunkStreams.push(chunkObject.body);
            }

            // --- FIX APPLIED HERE ---
            // Create a custom ReadableStream that combines all chunk streams
            // Then wrap it with FixedLengthStream, providing the total file size
            const combinedStream = new ReadableStream({
                async start(controller) {
                    for (const stream of chunkStreams) {
                        const reader = stream.getReader();
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                controller.enqueue(value);
                            }
                        } finally {
                            reader.releaseLock();
                        }
                    }
                    controller.close();
                }
            });

            // Wrap the combined stream with FixedLengthStream, using the session's total file size
            const { readable, writable } = new FixedLengthStream(session.file_size);
            combinedStream.pipeTo(writable); // Pipe the combined stream into the fixed-length stream

            // Upload final file
            await env.BUCKET.put(finalKey, readable, { // Use the readable side of FixedLengthStream
                httpMetadata: { contentType: session.mime_type }
            });

            const config = getConfig(env);
            const fileUrl = `${config.R2_URL}/${finalKey}`;

            // Save file metadata
            const completedAt = new Date().toISOString();
            await env.DB.prepare(`
              INSERT INTO files (
                id, sender_mobile_number, recipient_user_id, file_name,
                file_size, mime_type, r2_url, file_hash, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                fileId, session.sender_mobile_number, session.recipient_user_id,
                session.file_name, session.file_size, session.mime_type,
                fileUrl, fileHash, completedAt
            ).run();

            // Update session status
            await env.DB.prepare(
                'UPDATE upload_sessions SET status = "completed", file_id = ?, completed_at = ? WHERE id = ?'
            ).bind(fileId, completedAt, uploadId).run();

            // Clean up chunks (optional - you might want to keep them for a while)
            for (const chunk of chunks.results) {
                try {
                    await env.BUCKET.delete(chunk.r2_key);
                } catch (deleteError) {
                    console.warn('Failed to delete chunk:', chunk.r2_key, deleteError);
                }
            }

            await env.DB.prepare('DELETE FROM upload_chunks WHERE upload_id = ?')
                .bind(uploadId).run();

            return createResponse(
                {
                    message: 'File upload completed successfully',
                    fileId,
                    fileName: session.file_name,
                    fileSize: session.file_size,
                    mimeType: session.mime_type,
                    url: fileUrl
                },
                200,
                corsHeaders
            );

        } catch (assemblyError) {
            console.error('File Assembly Error:', assemblyError);

            // Mark session as failed
            await env.DB.prepare(
                'UPDATE upload_sessions SET status = "failed", error_message = ? WHERE id = ?'
            ).bind(assemblyError.message, uploadId).run();

            return createResponse(
                { error: 'Failed to assemble file from chunks' },
                500,
                corsHeaders
            );
        }

    } catch (error) {
        console.error('Complete Upload Error:', error);
        return createResponse({ error: 'Upload completion failed' }, 500, corsHeaders);
    }
}

async function handleAbortUpload(request, env) {
    try {
        const body = await request.json();
        const validation = validateUploads.abort(body);

        if (!validation.success) {
            return createResponse(
                { error: 'Invalid abort data', details: validation.error.errors },
                400,
                corsHeaders
            );
        }

        const { uploadId } = validation.data;

        // Get upload session
        const session = await env.DB.prepare(
            'SELECT * FROM upload_sessions WHERE id = ?'
        ).bind(uploadId).first();

        if (!session) {
            return createResponse(
                { error: 'Upload session not found' },
                404,
                corsHeaders
            );
        }

        // Get all chunks for cleanup
        const chunks = await env.DB.prepare(
            'SELECT r2_key FROM upload_chunks WHERE upload_id = ?'
        ).bind(uploadId).all();

        // Clean up chunks from R2
        for (const chunk of chunks.results) {
            try {
                await env.BUCKET.delete(chunk.r2_key);
            } catch (deleteError) {
                console.warn('Failed to delete chunk:', chunk.r2_key, deleteError);
            }
        }

        // Clean up database records
        await env.DB.batch([
            env.DB.prepare('DELETE FROM upload_chunks WHERE upload_id = ?').bind(uploadId),
            env.DB.prepare('UPDATE upload_sessions SET status = "aborted", updated_at = ? WHERE id = ?')
                .bind(new Date().toISOString(), uploadId)
        ]);

        return createResponse(
            { message: 'Upload aborted successfully' },
            200,
            corsHeaders
        );

    } catch (error) {
        console.error('Abort Upload Error:', error);
        return createResponse({ error: 'Upload abort failed' }, 500, corsHeaders);
    }
}

async function handleUploadStatus(request, env) {
    try {
        const url = new URL(request.url);
        const uploadId = url.searchParams.get('uploadId');

        if (!uploadId) {
            return createResponse(
                { error: 'Upload ID is required' },
                400,
                corsHeaders
            );
        }

        // Get upload session
        const session = await env.DB.prepare(
            'SELECT * FROM upload_sessions WHERE id = ?'
        ).bind(uploadId).first();

        if (!session) {
            return createResponse(
                { error: 'Upload session not found' },
                404,
                corsHeaders
            );
        }

        // Get uploaded chunks
        const uploadedChunks = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM upload_chunks WHERE upload_id = ?'
        ).bind(uploadId).first();

        const progress = Math.round((uploadedChunks.count / session.total_chunks) * 100);

        return createResponse(
            {
                uploadId: session.id,
                status: session.status,
                fileName: session.file_name,
                fileSize: session.file_size,
                progress,
                uploadedChunks: uploadedChunks.count,
                totalChunks: session.total_chunks,
                createdAt: session.created_at,
                updatedAt: session.updated_at
            },
            200,
            corsHeaders
        );

    } catch (error) {
        console.error('Upload Status Error:', error);
        return createResponse({ error: 'Failed to get upload status' }, 500, corsHeaders);
    }
}

async function handleResumeUpload(request, env) {
    try {
        const body = await request.json();
        const validation = validateUploads.resume(body);

        if (!validation.success) {
            return createResponse(
                { error: 'Invalid resume data', details: validation.error.errors },
                400,
                corsHeaders
            );
        }

        const { uploadId } = validation.data;

        // Get upload session
        const session = await env.DB.prepare(
            'SELECT * FROM upload_sessions WHERE id = ? AND status IN ("initiated", "uploading")'
        ).bind(uploadId).first();

        if (!session) {
            return createResponse(
                { error: 'Upload session not found or cannot be resumed' },
                404,
                corsHeaders
            );
        }

        // Get uploaded chunks
        const uploadedChunks = await env.DB.prepare(
            'SELECT chunk_index FROM upload_chunks WHERE upload_id = ? ORDER BY chunk_index'
        ).bind(uploadId).all();

        const uploadedChunkIndexes = uploadedChunks.results.map(chunk => chunk.chunk_index);
        const missingChunks = [];

        for (let i = 0; i < session.total_chunks; i++) {
            if (!uploadedChunkIndexes.includes(i)) {
                missingChunks.push(i);
            }
        }

        const progress = Math.round((uploadedChunkIndexes.length / session.total_chunks) * 100);

        return createResponse(
            {
                uploadId: session.id,
                status: session.status,
                progress,
                uploadedChunks: uploadedChunkIndexes.length,
                totalChunks: session.total_chunks,
                missingChunks,
                chunkSize: session.chunk_size,
                canResume: true
            },
            200,
            corsHeaders
        );

    } catch (error) {
        console.error('Resume Upload Error:', error);
        return createResponse({ error: 'Failed to resume upload' }, 500, corsHeaders);
    }
}