import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword, signToken, verifyToken, COOKIE_NAME } from '../lib/auth'
import type { Response } from 'express'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const officer = await prisma.officer.findUnique({ where: { email } })
  if (!officer) {
    const err: Error & { statusCode?: number } = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }

  const valid = await comparePassword(password, officer.passwordHash)
  if (!valid) {
    const err: Error & { statusCode?: number } = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }

  return {
    id: officer.id,
    name: officer.name,
    email: officer.email,
    role: officer.role,
  }
}

export function setSessionCookie(res: Response, token: string): void {
  // maxAge is in milliseconds for Express res.cookie.
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' })
}

export async function getSessionUser(token: string | null): Promise<AuthUser | null> {
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null

  const officer = await prisma.officer.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!officer) return null
  return officer
}
