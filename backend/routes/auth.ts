/**
 * routes/auth.ts
 * ---------------
 * Unified auth router — all auth endpoints in one place.
 *
 * Mounted at: /api/v1/auth (in server.ts)
 * Full paths:
 *   POST /api/v1/auth/otp/send              → send OTP via Twilio
 *   POST /api/v1/auth/otp/verify            → verify OTP
 *   GET  /api/v1/auth/google                → start Google OAuth flow
 *   GET  /api/v1/auth/google/callback       → Google OAuth callback
 *   GET  /api/v1/auth/microsoft             → start Microsoft OAuth flow
 *   GET  /api/v1/auth/microsoft/callback    → Microsoft OAuth callback
 *   GET  /api/v1/auth/oauth-debug           → show configured redirect URIs
 */

import express from 'express'
import passport from 'passport'
import {
  googleCallbackController,
  microsoftCallbackController,
  linkedinCallbackController,
  oauthDebugController,
} from '../controllers/auth.controller'
import {
  sendOtpController,
  verifyOtpController,
} from '../controllers/otp.controller'
import { oauthLimiter, otpLimiter, verifyOtpLimiter } from '../middleware/rateLimiters'

const router = express.Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const OAUTH_FAILURE_REDIRECT = `${FRONTEND_URL}/login?error=oauth_failed`

function sanitizeRole(input: unknown): 'employee' | 'employer' {
  return input === 'employer' ? 'employer' : 'employee'
}

// ── OTP ───────────────────────────────────────────────────────
router.post('/otp/send', otpLimiter, sendOtpController)
router.post('/otp/verify', verifyOtpLimiter, verifyOtpController)

// ── Debug ─────────────────────────────────────────────────────
router.get('/oauth-debug', oauthDebugController)

// ── Google OAuth ──────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const role = sanitizeRole(req.query.role)
  oauthLimiter(req, res, () => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: role 
  })(req, res, next)
  })
})

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: OAUTH_FAILURE_REDIRECT }),
  googleCallbackController,
)

// ── Microsoft OAuth ───────────────────────────────────────────
router.get('/microsoft', (req, res, next) => {
  const role = sanitizeRole(req.query.role)
  oauthLimiter(req, res, () => {
  passport.authenticate('microsoft', { 
    prompt: 'select_account',
    state: role
  })(req, res, next)
  })
})

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: OAUTH_FAILURE_REDIRECT }),
  microsoftCallbackController,
)

// ── LinkedIn OAuth ──────────────────────────────────────────────
router.get('/linkedin', (req, res, next) => {
  const role = sanitizeRole(req.query.role)
  oauthLimiter(req, res, () => {
    passport.authenticate('linkedin', { state: role })(req, res, next)
  })
})

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: OAUTH_FAILURE_REDIRECT }),
  linkedinCallbackController,
)

export default router