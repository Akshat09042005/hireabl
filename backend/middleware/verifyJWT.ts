import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/jwt'
import { sendError } from '../utils/response'

type JwtUser = {
  id: string
  email: string | null
  role: string
}

export type AuthenticatedRequest = Request & {
  user?: JwtUser
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Please login again', 401, 'AUTH_TOKEN_MISSING')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  const payload = verifyToken(token)
  if (!payload || typeof payload !== 'object') {
    return sendError(res, 'Please login again', 401, 'AUTH_TOKEN_INVALID')
  }

  const tokenUser = payload as Partial<JwtUser>
  if (!tokenUser.id || !tokenUser.role) {
    return sendError(res, 'Please login again', 401, 'AUTH_TOKEN_INVALID')
  }

  ;(req as AuthenticatedRequest).user = {
    id: tokenUser.id,
    email: tokenUser.email ?? null,
    role: tokenUser.role,
  }

  return next()
}
