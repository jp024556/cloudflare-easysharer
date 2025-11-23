import { createResponse } from '../utils/response.js';
import { corsHeaders } from '../utils/cors.js';
import { verifyJWT } from '../utils/jwt.js';

/**
 * Authentication middleware for Cloudflare Workers.
 * This function takes a 'next' handler and returns a new handler that first
 * attempts to authenticate the request using a JWT.
 *
 * If a valid JWT is found:
 * - The 'userId' from the JWT payload is attached to the 'env' object.
 * - The 'next' handler is called with the modified 'env'.
 *
 * If no JWT is found or it's invalid/expired:
 * - If the route *requires* authentication (which the 'next' handler would determine
 * by checking 'env.userId'), it will handle the unauthorized case.
 * - This middleware will return a 401 Unauthorized response if the token is present but invalid.
 * - If no token is present, it will simply pass the request to the next handler,
 * allowing non-authenticated routes to proceed.
 *
 * @param {Function} next The next handler function in the request chain (e.g., your router).
 * It should have the signature: `(request, env, ctx) => Promise<Response>`.
 * @returns {Function} A new async function that acts as the middleware.
 */
export function authenticate(next) {
    return async (request, env, ctx) => {
        const authHeader = request.headers.get('Authorization');
        let userId = null; // Initialize userId as null

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = await verifyJWT(token, env.JWT_SECRET);
                if (payload && payload.userId) {
                    userId = payload.userId;
                    // Attach userId to the env object for downstream handlers
                    // This modifies the env object for the current request context.
                    env.userId = userId;
                } else {
                    // Token is valid but payload doesn't contain userId or payload is null
                    console.warn('JWT payload missing userId or invalid payload structure:', payload);
                    return createResponse({ error: 'Unauthorized: Invalid token payload' }, 401, corsHeaders);
                }
            } catch (error) {
                console.warn('JWT verification failed:', error.message);
                // Token is invalid or expired
                return createResponse({ error: 'Unauthorized: Invalid or expired token' }, 401, corsHeaders);
            }
        }

        if(!userId){
            return createResponse({ error: 'Unauthorized: No token provided.' }, 401, corsHeaders);
        }

        // Proceed to the next handler.
        // The 'env' object passed to 'next' will now contain 'env.userId' if authentication was successful.
        // Routes that require authentication (like /files/received) should then check for env.userId.
        return next(request, env, ctx);
    };
}
