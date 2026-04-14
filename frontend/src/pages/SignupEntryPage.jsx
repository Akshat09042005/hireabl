import { useState } from 'react'
import { User, Building2 } from 'lucide-react'
import RoleCard from '../components/RoleCard'
import SocialButton from '../components/SocialButton'
import { useSignup } from '../context/SignupContext'

const PROVIDERS = ['Google', 'Microsoft', 'LinkedIn']
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

function SignupEntryPage() {
  const { setSelectedRole } = useSignup()
  const [role, setRole] = useState('')
  const [activeProvider, setActiveProvider] = useState('')

  const handleSocialSignup = (provider) => {
    setActiveProvider(provider)
    setSelectedRole(role)

    if (provider === 'Google') {
      const selectedRoleValue = role ? role.toLowerCase() : 'employee'
      window.location.href = `${BACKEND_URL}/api/v1/auth/google?role=${selectedRoleValue}`
      return
    }
    if (provider === 'Microsoft') {
      const selectedRoleValue = role ? role.toLowerCase() : 'employee'
      window.location.href = `${BACKEND_URL}/api/v1/auth/microsoft?role=${selectedRoleValue}`
      return
    }

    if (provider === 'LinkedIn') {
      const selectedRoleValue = role ? role.toLowerCase() : 'employee'
      window.location.href = `${BACKEND_URL}/api/v1/auth/linkedin?role=${selectedRoleValue}`
      return
    }

    alert('Coming soon')
    setActiveProvider('')
  }

  return (
    <main className="min-h-screen relative bg-[url('/signupbackground.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center font-['Inter'] p-[20px]">
      <div className="absolute inset-0 bg-transparent flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center w-full max-w-[420px] z-10 p-[20px]">
          
          <img 
            src="/logo.jpg" 
            className="w-[140px] h-[170px] object-cover object-top mb-[24px] rounded-[8px]" 
            style={{ mixBlendMode: 'multiply' }}
            alt="Logo" 
          />

          <section className="w-full bg-white rounded-[16px] p-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] text-center animate-signup-fade-in">
            <h1 className="text-[24px] font-bold text-[#111827] mb-[8px] mt-0 tracking-[-0.02em]">Create your account</h1>
            <p className="text-[15px] font-normal text-[#6b7280] mb-[32px]">
              Choose how you want to sign up.
            </p>

            <div className="flex flex-col gap-[12px] mb-[24px] mt-0">
              <RoleCard
                title="Sign up as Employee"
                selected={role === 'Employee'}
                onClick={() => setRole('Employee')}
                icon={User}
              />
              <RoleCard
                title="Sign up as Employer"
                selected={role === 'Employer'}
                onClick={() => setRole('Employer')}
                icon={Building2}
              />
            </div>

            {role && (
              <div className="mt-[44px] pt-[0px] animate-signup-social-fade-in" aria-live="polite">
                <div className="flex items-center justify-center gap-[12px] my-[24px] text-[13px] font-medium text-[#9ca3af]">
                  <div className="flex-1 h-[1px] bg-[#f3f4f6]"></div>
                  <span>Continue with</span>
                  <div className="flex-1 h-[1px] bg-[#f3f4f6]"></div>
                </div>
                <div className="flex flex-col gap-[12px]">
                  {PROVIDERS.map((provider) => (
                    <SocialButton
                      key={provider}
                      provider={provider}
                      onClick={() => handleSocialSignup(provider)}
                      isLoading={activeProvider === provider}
                      disabled={Boolean(activeProvider)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default SignupEntryPage
