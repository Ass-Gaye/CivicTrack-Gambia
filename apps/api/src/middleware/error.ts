import { Request, Response, NextFunction } from 'express'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { ZodError, ZodIssue } from 'zod'

interface AppError extends Error {
  statusCode?: number
  issues?: Array<{ path: string; message: string }>
}

/**
 * Centralized error handler. Never leaks stack traces or database internals
 * to the client in production.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500
  const isProd = process.env.NODE_ENV === 'production'

  // Unique constraint violations (e.g. duplicate reference code, duplicate email)
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'A record with this value already exists' },
    })
    return
  }

  // Prisma record-not-found
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: err.issues.map((i: ZodIssue) => ({ path: i.path.join('.'), message: i.message })),
      },
    })
    return
  }

  res.status(statusCode).json({
    error: {
      code: err.message || 'SERVER_ERROR',
      message: statusCode === 500 && isProd ? 'Internal server error' : err.message,
      ...(!isProd && { stack: err.stack }),
    },
  })
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } })
}
