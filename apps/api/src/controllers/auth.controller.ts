import { Request, Response, NextFunction } from 'express'
import { signToken } from '../lib/auth'
import { login, setSessionCookie, clearSessionCookie, getSessionUser } from '../services/auth.service'

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await login(req.body.email, req.body.password)
    const token = signToken({ sub: user.id, email: user.email, role: user.role })
    setSessionCookie(res, token)

    res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        message: 'Signed in successfully',
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function logoutHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    clearSessionCookie(res)
    res.json({ data: { ok: true, message: 'Signed out' } })
  } catch (err) {
    next(err)
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.['civictrack_session'] ?? null
    const user = await getSessionUser(token)

    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'No active session' } })
      return
    }

    res.json({ data: { user } })
  } catch (err) {
    next(err)
  }
}
