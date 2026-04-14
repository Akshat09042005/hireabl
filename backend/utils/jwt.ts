import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Missing JWT_SECRET in environment variables')
  }
  return secret
}
const JWT_SECRET = getJwtSecret()

/**
 * Generates a JWT token for a user.
 */
export function generateToken(user: any) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  )
}

/**
 * Verifies a JWT token.
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}
