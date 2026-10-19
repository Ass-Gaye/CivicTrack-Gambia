import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodIssue } from 'zod'

type Json = Record<string, unknown>
type Source = 'body' | 'params' | 'query'

/**
 * Validates request data with a Zod schema. By default validates the body;
 * pass `source: 'params'` or `source: 'query'` to validate route/query data.
 * Parsed values replace the originals so downstream handlers receive typed data.
 */
export function validate(schema: ZodSchema<Json>, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const issues = result.error.issues.map((issue: ZodIssue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', issues },
      })
      return
    }

    req[source] = result.data
    next()
  }
}
