import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('GLOBAL ERROR:', err)

  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
  })
}