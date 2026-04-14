import { Request, Response } from 'express'
import { 
  GOOGLE_CALLBACK_URL, 
  MICROSOFT_CALLBACK_URL,
  LINKEDIN_CALLBACK_URL 
} from '../services/passport.service'
import { generateToken } from '../utils/jwt'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export function googleCallbackController(req: Request, res: Response) {
  res.redirect(`${FRONTEND_URL}/verify-otp?social=success`)
}

export function microsoftCallbackController(req: Request, res: Response) {
  res.redirect(`${FRONTEND_URL}/verify-otp?social=success`)
}

export function linkedinCallbackController(req: Request, res: Response) {
  res.redirect(`${FRONTEND_URL}/verify-otp?social=success`)
}

export function oauthDebugController(req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      google: { redirectUri: GOOGLE_CALLBACK_URL },
      microsoft: { redirectUri: MICROSOFT_CALLBACK_URL },
      linkedin: { redirectUri: LINKEDIN_CALLBACK_URL },
    },
  })
}