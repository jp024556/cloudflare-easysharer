import { createResponse } from '../utils/response.js';
import { corsHeaders } from '../utils/cors.js';
import { getRequestParam } from '../utils/request.js';

export async function handleShortCode(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    try {
        if (method === 'GET') {
            return await handleResolveShortCode(request, env);
        }

        return createResponse({ error: 'Not Found' }, 404, corsHeaders);
    } catch (error) {
        console.error('Short Code Handler Error:', error);
        return createResponse({ error: 'Internal Server Error' }, 500, corsHeaders);
    }

    // Assume these are imported or defined elsewhere in your project
    // import { createResponse, corsHeaders } from '../utils/responseHandlers'; // Example path
    // import { D1Database } from '@cloudflare/workers-types'; // For type hinting if using TypeScript

    /**
     * Handles the resolution of a short code to a recipient (user) ID.
     * This function expects a 'code' query parameter in the request URL.
     *
     * @param {Request} request The incoming request object.
     * @param {Env & { DB: D1Database }} env The environment variables, including the D1 binding.
     * @returns {Promise<Response>} A Response object containing the recipientId or an error.
     */
    async function handleResolveShortCode(request, env) {
        try {
            const shortCode = getRequestParam(request, 's'); // Extract the short code from the request URL

            // 1. Validate input: Ensure 'code' query parameter is present.
            if (!shortCode) {
                return createResponse(
                    { error: 'Short code is required to resolve recipient ID.' },
                    400, // Bad Request
                    corsHeaders
                );
            }

            // 2. Query D1 to find the recipient_user_id associated with the short code.
            // Assuming 'users' is your table and 'short_code' is a column mapping to 'id' (recipientId).
            const { results } = await env.DB.prepare(
                'SELECT id FROM users WHERE short_code = ?'
            )
                .bind(shortCode)
                .all();

            // 3. Check if a recipient ID was found for the given short code.
            if (results.length === 0) {
                return createResponse(
                    { error: 'Invalid or expired short code provided.' },
                    404, // Not Found
                    corsHeaders
                );
            }

            // 4. Extract the recipient ID.
            const recipientId = results[0].id; // Assuming 'id' is the user's ID/recipientId

            // 5. Return the recipient ID in the response.
            return createResponse(
                {
                    message: 'Short code resolved successfully.',
                    recipientId: recipientId
                },
                200, // OK
                corsHeaders
            );

        } catch (error) {
            console.error('Resolve Short Code Error:', error);
            // In case of any unexpected error during the process
            return createResponse(
                { error: 'Failed to resolve short code due to a server error.' },
                500, // Internal Server Error
                corsHeaders
            );
        }
    }
}