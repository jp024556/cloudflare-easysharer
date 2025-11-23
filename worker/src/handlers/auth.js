import { validateAuth } from '../validation/auth.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { generateJWT, verifyJWT } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { createResponse } from '../utils/response.js';
import { corsHeaders } from '../utils/cors.js';
import { generateResetToken } from '../utils/tokens.js';
import { getConfig } from '../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';
import { generateUniqueShortCode } from '../utils/generateShortcode.js';

export async function handleAuth(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    const routes = {
      'POST /auth/register': () => handleRegister(request, env),
      'POST /auth/login': () => handleLogin(request, env),
      'POST /auth/logout': () => handleLogout(request, env),
      'POST /auth/forgot-password': () => handleForgotPassword(request, env),
      'POST /auth/reset-password': () => handleResetPassword(request, env),
      'POST /auth/change-password': () => handleChangePassword(request, env),
      'GET /auth/user': () => handleGetUserDetails(request, env)
    };

    const routeKey = `${method} ${path}`;
    const handler = routes[routeKey];

    if (handler) {
      return await handler();
    }

    return createResponse({ error: 'Not Found' }, 404, corsHeaders);
  } catch (error) {
    console.error('Auth Handler Error:', error);
    return createResponse({ error: 'Internal Server Error' }, 500, corsHeaders);
  }
}

async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const validation = validateAuth.register(body);

    if (!validation.success) {
      return createResponse(
        { error: 'Invalid input data', details: validation.error.errors },
        400,
        corsHeaders
      );
    }

    const { email, password, mobileNumber, name } = validation.data;

    // Check if user exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email).first();

    if (existingUser) {
      return createResponse({ error: 'Email already registered' }, 409, corsHeaders);
    }

    // Create user
    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);
    const createdAt = new Date().toISOString();
    const shortCode = await generateUniqueShortCode(env);

    await env.DB.prepare(
      'INSERT INTO users (id, name, email, password_hash, mobile_number, created_at, short_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, name, email, hashedPassword, mobileNumber || null, createdAt, shortCode).run();

    return createResponse(
      { message: 'User registered successfully', userId },
      201,
      corsHeaders
    );
  } catch (error) {
    console.error('Register Error:', error);
    return createResponse({ error: 'Registration failed' }, 500, corsHeaders);
  }
}

async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const validation = validateAuth.login(body);

    if (!validation.success) {
      return createResponse({ error: 'Invalid input data' }, 400, corsHeaders);
    }

    const { email, password } = validation.data;
    const config = getConfig(env);

    // Get user
    const user = await env.DB.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .bind(email).first();

    if (!user || !(await comparePassword(password, user.password_hash))) {
      return createResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Generate JWT with configurable expiration
    const token = await generateJWT(
      { userId: user.id, email: user.email }, 
      env.JWT_SECRET, 
      config.JWT_EXPIRES_IN
    );

    return createResponse(
      { message: 'Login successful', token, expiresIn: config.JWT_EXPIRES_IN },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Login Error:', error);
    return createResponse({ error: 'Login failed' }, 500, corsHeaders);
  }
}

async function handleLogout(request, env) {
  try {
    const payload = await getAuthenticatedUser(request, env);
    if (!payload) {
      return createResponse({ error: 'Invalid or missing token' }, 401, corsHeaders);
    }

    return createResponse({ message: 'Logged out successfully' }, 200, corsHeaders);
  } catch (error) {
    console.error('Logout Error:', error);
    return createResponse({ error: 'Logout failed' }, 500, corsHeaders);
  }
}

async function handleForgotPassword(request, env) {
  try {
    const body = await request.json();
    const validation = validateAuth.forgotPassword(body);

    if (!validation.success) {
      return createResponse({ error: 'Invalid input data' }, 400, corsHeaders);
    }

    const { email } = validation.data;
    const config = getConfig(env);

    // Check if user exists
    const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
      .bind(email).first();

    // Always return success for security
    if (!user) {
      return createResponse({ message: 'Password reset email sent' }, 200, corsHeaders);
    }

    // Generate and store reset token
    const resetToken = generateResetToken();
    const hashedToken = await hashPassword(resetToken);
    const expiresAt = new Date(Date.now() + config.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT OR REPLACE INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, hashedToken, expiresAt).run();

    // Send email using Amazon SES
    await sendPasswordResetEmail(email, resetToken, env);

    return createResponse({ message: 'Password reset email sent' }, 200, corsHeaders);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return createResponse({ error: 'Failed to send email' }, 500, corsHeaders);
  }
}

async function handleResetPassword(request, env) {
  try {
    const body = await request.json();
    const validation = validateAuth.resetPassword(body);

    if (!validation.success) {
      return createResponse({ error: 'Invalid input data' }, 400, corsHeaders);
    }

    const { token, newPassword } = validation.data;

    // Find valid reset token
    const resetTokenData = await env.DB.prepare(
      'SELECT user_id, token_hash FROM password_reset_tokens WHERE expires_at > ?'
    ).bind(new Date().toISOString()).first();

    if (!resetTokenData || !(await comparePassword(token, resetTokenData.token_hash))) {
      return createResponse({ error: 'Invalid or expired token' }, 400, corsHeaders);
    }

    // Update password and delete token
    const hashedPassword = await hashPassword(newPassword);
    
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(hashedPassword, resetTokenData.user_id),
      env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?')
        .bind(resetTokenData.user_id)
    ]);

    return createResponse({ message: 'Password has been reset successfully' }, 200, corsHeaders);
  } catch (error) {
    console.error('Reset Password Error:', error);
    return createResponse({ error: 'Password reset failed' }, 500, corsHeaders);
  }
}

async function handleChangePassword(request, env) {
  try {
    const payload = await getAuthenticatedUser(request, env);
    if (!payload) {
      return createResponse({ error: 'Invalid or missing token' }, 401, corsHeaders);
    }

    const body = await request.json();
    const validation = validateAuth.changePassword(body);

    if (!validation.success) {
      return createResponse({ error: 'Invalid input data' }, 400, corsHeaders);
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user's current password
    const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(payload.userId).first();

    if (!user || !(await comparePassword(currentPassword, user.password_hash))) {
      return createResponse({ error: 'Invalid current password' }, 401, corsHeaders);
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(hashedPassword, payload.userId).run();

    return createResponse({ message: 'Password changed successfully' }, 200, corsHeaders);
  } catch (error) {
    console.error('Change Password Error:', error);
    return createResponse({ error: 'Password change failed' }, 500, corsHeaders);
  }
}

/**
 * Handles the API request to get details for the authenticated user.
 * It assumes `env.userId` is populated by an authentication middleware.
 *
 * @param {Request} request The incoming request object.
 * @param {Env & { DB: D1Database, userId?: string }} env The environment variables, including D1 binding and optional userId.
 * @returns {Promise<Response>} A Response object containing user details or an error.
 */
async function handleGetUserDetails(request, env) {
  try {
    const payload = await getAuthenticatedUser(request, env);
    const userId = payload.userId;

    // 1. Authentication Check: Ensure userId is present.
    if (!userId) {
      return createResponse(
        { error: 'Authentication required to access user details.' },
        401, // Unauthorized
        corsHeaders
      );
    }

    // 2. Query D1 for user details.
    // IMPORTANT: Only select non-sensitive information. NEVER select 'password' hash.
    const { results } = await env.DB.prepare(
      'SELECT id, name, email, mobile_number, short_code, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .all();

    // 3. Check if user was found.
    if (!results || results.length === 0) {
      return createResponse(
        { error: 'User not found.' },
        404, // Not Found
        corsHeaders
      );
    }

    // 4. Return user details.
    const user = results[0]; // Assuming 'id' is unique, there will be at most one result.
    return createResponse(
      {
        message: 'User details retrieved successfully.',
        user: user
      },
      200, // OK
      corsHeaders
    );

  } catch (error) {
    console.error('Get User Details Error:', error);
    // In case of any unexpected error during the process
    return createResponse(
      { error: 'Failed to retrieve user details due to a server error.' },
      500, // Internal Server Error
      corsHeaders
    );
  }
}

export async function getAuthenticatedUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return await verifyJWT(token, env.JWT_SECRET);
}