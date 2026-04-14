import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  clearStoredToken,
  getAuthUserFromToken,
  getStoredToken,
  setStoredToken,
} from '../utils/auth'

const AuthContext = createContext(null)

function readInitialAuth() {
  const token = getStoredToken()
  const user = token ? getAuthUserFromToken(token) : null
  return { token, user }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readInitialAuth)

  const login = useCallback((token) => {
    setStoredToken(token)
    setAuth({
      token,
      user: getAuthUserFromToken(token),
    })
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setAuth({ token: '', user: null })
  }, [])

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      isAuthenticated: Boolean(auth.token && auth.user),
      login,
      logout,
    }),
    [auth, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
