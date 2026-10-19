import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn']

export const COOKIE_NAME = 'civictrack_session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface TokenPayload {
  sub: string
  email: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload
  } catch {
    return null
  }
}

/**
 * Cookie options for the session cookie.
 * HttpOnly: the frontend cannot read the token (mitigates XSS theft).
 * SameSite=Strict: only sent on same-site navigation (CSRF mitigation).
 * Secure: only over HTTPS in production.
 */
export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: isProd,
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours in seconds, mirrors JWT_EXPIRES_IN
  }
}
