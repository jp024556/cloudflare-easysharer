import { z } from 'zod';
import { ALLOWED_MIME_TYPES } from '../utils/constants.js';

export const validateUploads = {
    initiate: (data) => z.object({
        fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
        fileSize: z.number().positive('File size must be positive'),
        mimeType: z.string().refine(
            (type) => ALLOWED_MIME_TYPES.includes(type),
            'Unsupported file type'
        ),
        senderMobileNumber: z.string().min(1, 'Name cannot be empty'),
        recipientId: z.string().uuid('Invalid recipient ID format'),
        chunkSize: z.number().positive().optional()
    }).safeParse(data),

    chunk: (data) => z.object({
        uploadId: z.string().uuid('Invalid upload ID format'),
        chunkIndex: z.number().min(0, 'Chunk index must be non-negative'),
        chunk: z.any().refine(
            (chunk) => chunk && chunk.size > 0,
            'Chunk data is required'
        ),
        chunkHash: z.string().optional()
    }).safeParse(data),

    complete: (data) => z.object({
        uploadId: z.string().uuid('Invalid upload ID format'),
        fileHash: z.string().optional()
    }).safeParse(data),

    abort: (data) => z.object({
        uploadId: z.string().uuid('Invalid upload ID format')
    }).safeParse(data),

    resume: (data) => z.object({
        uploadId: z.string().uuid('Invalid upload ID format')
    }).safeParse(data)
};