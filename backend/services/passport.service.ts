import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import { PassportStatic } from 'passport'

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

export const GOOGLE_CALLBACK_URL = googleCallbackUrl()
export const MICROSOFT_CALLBACK_URL = microsoftCallbackUrl()

// ── Passport Init ───────────────────────────────────────

export function initPassport(passport: PassportStatic) {

  // ✅ Google Strategy
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: Function
    ) => {
      const email = profile.emails?.[0]?.value ?? null

      const user = {
        id: profile.id,
        name: profile.displayName || null,
        email,
        provider: 'google',
      }

      return done(null, user)
    }
  ))

  // ✅ Microsoft Strategy
  passport.use(new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      callbackURL: MICROSOFT_CALLBACK_URL,
      scope: ['user.read'],
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: any, // ⚠️ no proper types available
      done: Function
    ) => {
      const email = profile.emails?.[0]?.value ?? null

      const user = {
        id: profile.id,
        name: profile.displayName || null,
        email,
        provider: 'microsoft',
      }

      return done(null, user)
    }
  ))

  // ✅ Session
  passport.serializeUser((user: any, done: Function) => done(null, user))
  passport.deserializeUser((user: any, done: Function) => done(null, user))
}