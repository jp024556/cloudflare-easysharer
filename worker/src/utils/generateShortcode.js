/**
 * Generates a random string of a specified length from a safe character set.
 * Excludes ambiguous characters (0/O, 1/l/I) to improve readability.
 *
 * @param {number} length The desired length of the shortcode.
 * @returns {string} A random alphanumeric string.
 */
function generateRandomString(length) {
    // Define a character set that avoids ambiguous characters
    // (e.g., 0, O, o, 1, l, I, i, B, 8, S, 5, Z, 2, G, 6, etc. depending on font)
    // For simplicity and common readability, we'll exclude some common confusers.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // No 0, O, 1, I, l
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generates a unique shortcode by checking against the D1 database.
 * Retries generation if a collision is found.
 *
 * @param {Env & { DB: D1Database }} env The environment variables, including the D1 binding.
 * @param {number} [length=7] The desired length of the shortcode.
 * @param {number} [maxRetries=5] The maximum number of retries to find a unique code.
 * @returns {Promise<string|null>} A unique shortcode string, or null if a unique code could not be generated after maxRetries.
 */
export async function generateUniqueShortCode(env, length = 7, maxRetries = 5) {
    if (!env.DB) {
        console.error('D1 database binding (env.DB) is not available.');
        throw new Error('Database not configured for shortcode generation.');
    }

    for (let i = 0; i < maxRetries; i++) {
        const shortCode = generateRandomString(length);

        // Check if this shortcode already exists in the 'users' table
        // (assuming 'short_code' column exists and is unique)
        try {
            const { results } = await env.DB.prepare(
                'SELECT id FROM users WHERE short_code = ?'
            ).bind(shortCode).all();

            if (results.length === 0) {
                // Shortcode is unique! Return it.
                return shortCode;
            } else {
                console.warn(`Shortcode collision detected: ${shortCode}. Retrying...`);
            }
        } catch (dbError) {
            console.error(`Database error during shortcode uniqueness check: ${dbError}`);
            // Depending on your error handling strategy, you might re-throw or return null here
            throw dbError; // Re-throw to indicate a critical DB issue
        }
    }

    // If we reach here, we failed to generate a unique shortcode after maxRetries
    console.error(`Failed to generate a unique shortcode after ${maxRetries} retries.`);
    return null;
}