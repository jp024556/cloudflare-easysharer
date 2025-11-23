import { z } from 'zod';
import { ALLOWED_MIME_TYPES } from '../utils/constants.js';

export const validateFiles = {
  upload: (data) => z.object({
    senderMobileNumber: z.string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number format'),
    recipientId: z.string()
      .uuid('Invalid recipient ID format'),
    files: z.array(z.any())
      .min(1, 'At least one file is required')
      .max(50, 'Maximum 50 files allowed')
  }).safeParse(data),

  fileType: (mimeType) => ALLOWED_MIME_TYPES.includes(mimeType),

  mobileNumber: (number) => /^[6-9]\d{9}$/.test(number)
};