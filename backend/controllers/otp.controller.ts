import { Request, Response, NextFunction } from 'express'
import { sendOtp, verifyOtp } from '../services/otp.service'
import { normalizePhone, isValidPhoneIndia, isValidOtp6 } from '../utils/phoneValidator'
import { sendSuccess, sendError } from '../utils/response'
import { verifyToken } from '../utils/jwt'
import { prisma } from '../utils/prisma'

export async function sendOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = normalizePhone(req.body?.phone)

    if (!isValidPhoneIndia(phone)) {
      return sendError(res, 'Please enter a valid phone number', 400, 'INVALID_PHONE')
    }

    const result = await sendOtp(phone)

    return sendSuccess(res, 200, 'OTP sent successfully', { status: result.status })
  } catch (err: any) {
    console.error('OTP ERROR:', err)
    if (err?.status === 429 || err?.statusCode === 429) {
      return sendError(res, 'Too many attempts. Please try after some time', 429, 'RATE_LIMITED')
    }
    return sendError(res, 'Failed to send OTP. Please try again', 400, 'OTP_SEND_FAILED')
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = normalizePhone(req.body?.phone)
    const normalizedPhone = phone.trim()
    const otp = String(req.body?.otp || '').trim()

    if (!isValidPhoneIndia(normalizedPhone)) {
      return sendError(res, 'Please enter a valid phone number', 400, 'INVALID_PHONE')
    }

    if (!isValidOtp6(otp)) {
      return sendError(res, 'OTP must be 6 digits', 400, 'INVALID_OTP_FORMAT')
    }

    const result = await verifyOtp(normalizedPhone, otp)

    if (!result.approved) {
      return sendError(res, 'Invalid OTP. Please try again.', 400, 'OTP_INVALID')
    }

    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim()
      const payload = verifyToken(token)
      if (payload && typeof payload === 'object') {
        const userId = (payload as { id?: string }).id
        if (userId) {
          try {
            const [currentUser, existingUser] = await Promise.all([
              prisma.user.findUnique({ where: { id: userId } }),
              prisma.user.findUnique({ where: { phone: normalizedPhone } }),
            ])

            if (!currentUser) {
              return sendError(res, 'Please login again', 401, 'SESSION_INVALID')
            }

            if (existingUser && existingUser.id !== userId) {
              return sendError(res, 'Phone number already in use', 400, 'PHONE_CONFLICT')
            }

            if (currentUser.phone !== normalizedPhone) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  phone: normalizedPhone,
                },
              })
            }
          } catch (updateErr) {
            console.error('[verifyOtpController] phone update failed', updateErr)
            if ((updateErr as any)?.code === 'P2002') {
              return sendError(res, 'Phone number already in use', 400, 'PHONE_CONFLICT')
            }
            return sendError(res, 'Phone verification failed. Try again.', 400, 'OTP_PHONE_UPDATE_FAILED')
          }
        }
      }
    }

    return sendSuccess(res, 200, 'OTP verified successfully')
  } catch (err: any) {
    console.error('OTP ERROR:', err)
    if (err?.status === 429 || err?.statusCode === 429) {
      return sendError(res, 'Too many attempts. Please try after some time', 429, 'RATE_LIMITED')
    }
    if (err?.code === 'P2002') {
      return sendError(res, 'Phone number already in use', 400, 'PHONE_CONFLICT')
    }
    return sendError(res, 'Unable to process request. Please try again', 400, 'OTP_VERIFY_FAILED')
  }
}