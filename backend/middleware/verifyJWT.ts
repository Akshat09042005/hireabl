import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/jwt'

type JwtUser = {
  id: string
  email: string | null
  role: string
}

export type AuthenticatedRequest = Request & {
  user?: JwtUser
}

export function verifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing',
    })
  }

  const token = authHeader.slice('Bearer '.length).trim()
  const payload = verifyToken(token)
  if (!payload || typeof payload !== 'object') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }

  const tokenUser = payload as Partial<JwtUser>
  if (!tokenUser.id || !tokenUser.role) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token payload',
    })
  }

  req.user = {
    id: tokenUser.id,
    email: tokenUser.email ?? null,
    role: tokenUser.role,
  }

  return next()
}
