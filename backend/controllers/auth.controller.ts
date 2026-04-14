import { Request, Response } from 'express'
import { 
  GOOGLE_CALLBACK_URL, 
  MICROSOFT_CALLBACK_URL,
  LINKEDIN_CALLBACK_URL 
} from '../services/passport.service'
import { generateToken } from '../utils/jwt'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const AUTH_SUCCESS_URL = `${FRONTEND_URL}/auth-success`
const AUTH_FAILURE_URL = `${FRONTEND_URL}/login?error=oauth_failed`

function handleOAuthCallback(req: Request, res: Response) {
  const user = req.user as Record<string, unknown> | undefined
  if (!user) {
    return res.redirect(AUTH_FAILURE_URL)
  }

  const token = generateToken(user)
  return res.redirect(`${AUTH_SUCCESS_URL}?token=${encodeURIComponent(token)}`)
}

export function googleCallbackController(req: Request, res: Response) {
  return handleOAuthCallback(req, res)
}

export function microsoftCallbackController(req: Request, res: Response) {
  return handleOAuthCallback(req, res)
}

export function linkedinCallbackController(req: Request, res: Response) {
  return handleOAuthCallback(req, res)
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