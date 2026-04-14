export const AUTH_TOKEN_KEY = 'hirabl_auth_token'

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwtPayload(token) {
  const parts = String(token || '').split('.')
  if (parts.length < 2) return null

  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch {
    return null
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthUserFromToken(token) {
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.id || !payload.role) return null

  return {
    id: String(payload.id),
    email: payload.email ? String(payload.email) : null,
    role: String(payload.role).toLowerCase(),
  }
}
