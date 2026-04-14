import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import OAuth2Strategy from 'passport-oauth2'
import { PassportStatic } from 'passport'
import { findOrCreateOAuthUser } from './auth.service'

// ── URL helpers ─────────────────────────────────────────

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5051').replace(/\/$/, '')

function googleCallbackUrl(): string {
  const fromEnv = process.env.GOOGLE_CALLBACK_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${BACKEND_URL}/api/v1/auth/google/callback`
}

function microsoftCallbackUrl(): string {
  const fromEnv = process.env.MICROSOFT_CALLBACK_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${BACKEND_URL}/api/v1/auth/microsoft/callback`
}

function linkedinCallbackUrl(): string {
  const fromEnv = process.env.LINKEDIN_CALLBACK_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${BACKEND_URL}/api/v1/auth/linkedin/callback`
}

export const GOOGLE_CALLBACK_URL = googleCallbackUrl()
export const MICROSOFT_CALLBACK_URL = microsoftCallbackUrl()
export const LINKEDIN_CALLBACK_URL = linkedinCallbackUrl()

function sanitizeRole(input: unknown): 'employee' | 'employer' {
  return input === 'employer' ? 'employer' : 'employee'
}

// ── Passport Init ───────────────────────────────────────

export function initPassport(passport: PassportStatic) {

  // ✅ Google Strategy
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: Function
    ) => {
      try {
        console.log('[passport] Google verify callback reached')
        const email = profile.emails?.[0]?.value ?? null
        const name = profile.displayName || ''
        const providerId = profile.id
        const role = sanitizeRole(req.query?.state)

        if (!email) {
          return done(new Error('Email is required from Google profile'), null)
        }

        const user = await findOrCreateOAuthUser({
          email,
          name,
          provider: 'google',
          providerId,
          role,
        })

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  ))

  // ✅ Microsoft Strategy
  passport.use(new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      callbackURL: MICROSOFT_CALLBACK_URL,
      scope: ['user.read'],
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: Function
    ) => {
      try {
        const email = profile.emails?.[0]?.value ?? null
        const name = profile.displayName || ''
        const providerId = profile.id
        const role = sanitizeRole(req.query?.state)

        if (!email) {
          return done(new Error('Email is required from Microsoft profile'), null)
        }

        const user = await findOrCreateOAuthUser({
          email,
          name,
          provider: 'microsoft',
          providerId,
          role,
        })

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  ))

  // ✅ LinkedIn Strategy (OpenID Connect)
  const linkedinStrategy = new OAuth2Strategy(
    {
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: LINKEDIN_CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      params: any,
      profile: any,
      done: Function
    ) => {
      try {
        console.log('[passport] LinkedIn verify callback reached')

        // Fetch profile from LinkedIn OpenID Connect userinfo endpoint
        const res = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          console.error('[passport] LinkedIn userinfo error:', await res.text())
          return done(new Error('Failed to fetch LinkedIn profile'), null)
        }
        const info = (await res.json()) as any

        const email = info.email || null
        const name = [info.given_name, info.family_name].filter(Boolean).join(' ')
        const providerId = info.sub
        const role = sanitizeRole(req.query?.state)

        if (!email) {
          return done(new Error('Email is required from LinkedIn profile'), null)
        }

        const user = await findOrCreateOAuthUser({
          email,
          name,
          provider: 'linkedin',
          providerId,
          role,
        })

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
  linkedinStrategy.name = 'linkedin'
  passport.use(linkedinStrategy)

  // ✅ Session
  passport.serializeUser((user: any, done: Function) => done(null, user))
  passport.deserializeUser((user: any, done: Function) => done(null, user))
}