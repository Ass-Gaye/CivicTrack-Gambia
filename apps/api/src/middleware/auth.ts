import { Request, Response, NextFunction } from 'express'
import { verifyToken, COOKIE_NAME, type TokenPayload } from '../lib/auth'
import { prisma } from '../lib/prisma'

export interface AuthenticatedRequest extends Request {
  officer?: { id: string; name: string; email: string; role: string }
}

/**
 * Authentication middleware for officer-only endpoints.
 * Accepts the session token from the HttpOnly cookie or, as a fallback,
 * from an Authorization: Bearer <token> header.
 */
export async function authenticateOfficer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAME] ?? (req.headers.authorization ?? '').replace(/^Bearer\s/i, '')

    if (!token) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } })
      return
    }

    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired session' } })
      return
    }

    const officer = await prisma.officer.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!officer) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Account no longer exists' } })
      return
    }

    req.officer = officer
    next()
  } catch (err) {
    next(err)
  }
}

export function requireOfficer(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.officer) {
    const err = new Error('Authentication required') as Error & { statusCode?: number }
    err.statusCode = 401
    next(err)
    return
  }
  next()
}

declare global {
  namespace Express {
    interface Request {
      officer?: { id: string; name: string; email: string; role: string }
    }
  }
}
