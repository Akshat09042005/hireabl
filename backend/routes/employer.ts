import express from 'express'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middleware/verifyJWT'
import { updateEmployerOnboardingController } from '../controllers/employer.controller'

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

router.post('/onboard', updateEmployerOnboardingController)

export default router
