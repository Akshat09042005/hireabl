import express from 'express'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middleware/verifyJWT'
import { prisma } from '../utils/prisma'
import { sendError } from '../utils/response'

const router = express.Router()

router.get('/me', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id
  if (!userId) {
    return sendError(res, 'Please login again', 401, 'UNAUTHORIZED')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      qualification: true,
      companyName: true,
      designation: true,
      roleInCompany: true,
      companyWebsite: true,
      industry: true,
      companySize: true,
      gstNumber: true,
      profilePhoto: true,
      onboardingCompleted: true,
      role: true,
    },
  })

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  })
})

export default router
