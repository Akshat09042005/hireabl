import express from 'express'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middleware/verifyJWT'

const router = express.Router()

router.get('/me', (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest
  return res.status(200).json({
    success: true,
    data: {
      user: authReq.user ?? null,
    },
  })
})

export default router
