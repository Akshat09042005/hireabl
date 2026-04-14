import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthUserFromToken } from '../utils/auth'

const FALLBACK_ERROR_ROUTE = '/login?error=oauth_failed'

function AuthSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      navigate(FALLBACK_ERROR_ROUTE, { replace: true })
      return
    }

    const user = getAuthUserFromToken(token)
    if (!user) {
      navigate(FALLBACK_ERROR_ROUTE, { replace: true })
      return
    }

    login(token)

    const role = user.role
    let nextPath = '/employee/onboarding'
    if (role === 'employer') {
      nextPath = '/employer/onboarding'
    }

    console.log('User Role:', user.role)
    console.log('Next Path:', nextPath)
    navigate(`/verify-otp?social=success&next=${nextPath}`, { replace: true })
  }, [login, navigate, searchParams])

  return null
}

export default AuthSuccessPage
