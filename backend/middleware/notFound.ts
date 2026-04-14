import { Request, Response } from 'express'
import { sendError } from '../utils/response'

export function notFound(req: Request, res: Response) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND')
}