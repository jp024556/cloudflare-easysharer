import jwt from 'jsonwebtoken';

export async function generateJWT(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { 
    expiresIn: expiresIn || '1h',
    algorithm: 'HS256' 
  });
}

export async function verifyJWT(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
}