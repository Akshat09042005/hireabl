import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function EmployerOnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    console.log('User Role:', user.role)
    if (user.role !== 'employer') {
      navigate('/employee/onboarding', { replace: true })
    }
  }, [navigate, user])

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f8fb] p-6">
      <section className="w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#111827]">Employer Onboarding</h1>
        <p className="mt-4 text-[#6b7280]">
          JWT authentication is complete. Build employer onboarding steps here.
        </p>
      </section>
    </main>
  )
}

export default EmployerOnboardingPage
