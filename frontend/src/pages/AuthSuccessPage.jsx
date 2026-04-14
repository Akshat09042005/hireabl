import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const AUTH_TOKEN_KEY = 'hirabl_auth_token'
const FALLBACK_ERROR_ROUTE = '/login?error=oauth_failed'

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function AuthSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      navigate(FALLBACK_ERROR_ROUTE, { replace: true })
      return
    }

    const payload = decodeJwtPayload(token)
    if (!payload || !payload.id || !payload.role) {
      navigate(FALLBACK_ERROR_ROUTE, { replace: true })
      return
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token)

    const role = String(payload.role).toLowerCase()
    const nextRoute = role === 'employer' ? '/employer/onboarding' : '/employee/onboarding'
    const verifyPath = `/verify-otp?social=success&next=${encodeURIComponent(nextRoute)}`
    navigate(verifyPath, { replace: true })
  }, [navigate, searchParams])

  return null
}

export default AuthSuccessPage
