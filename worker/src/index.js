import { handleAuth } from './handlers/auth.js';
import { handleFiles } from './handlers/files.js';
import { handleUploads } from './handlers/uploads.js';
import { corsHeaders } from './utils/cors.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { createResponse } from './utils/response.js';
import { authenticate } from './middleware/authenticate.js';
import { handleShortCode } from './handlers/shortcode.js';

export default {
  async fetch(request, env, ctx) {
    try {
      console.log('Request received:', request.method, request.url)

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      console.log('Processing path:', path)

      // Apply rate limiting for API routes only
      if (path.startsWith('/auth/') || path.startsWith('/files/')) {
        const rateLimitResult = await rateLimiter(request, env);
        if (rateLimitResult.limited) {
          return createResponse(
            {
              error: 'Rate limit exceeded',
              details: 'Too many requests. Please try again later.'
            },
            429,
            corsHeaders
          );
        }
      }

      // Health check endpoint
      if (path === '/health' && request.method === 'GET') {
        return createResponse(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          },
          200,
          corsHeaders
        );
      }

      // API route handling
      if (path.startsWith('/auth/')) {
        console.log('Routing to auth handler')
        return await handleAuth(request, env, ctx);
      } else if (path.startsWith('/files/')) {
        console.log('Routing to files handler')
        return await authenticate(handleFiles)(request, env, ctx);
      } else if (path.startsWith('/uploads/')) {
        console.log('Routing to uploads handler')
        return await handleUploads(request, env, ctx);
      } else if(path.startsWith('/s/')) {
        console.log('Routing to shortcode handler')
        return await handleShortCode(request, env, ctx);
      }

      return createResponse(
        {
          error: 'Not Found',
          details: 'The requested endpoint does not exist'
        },
        404,
        corsHeaders
      );


    } catch (error) {
      console.error('Worker Error:', error);
      console.error('Error stack:', error.stack)
      return createResponse(
        {
          error: 'Internal Server Error',
          details: 'An unexpected error occurred'
        },
        500,
        corsHeaders
      );
    }
  }
};