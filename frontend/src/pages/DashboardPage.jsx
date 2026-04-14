import { Navigate } from 'react-router-dom'
import { useSignup } from '../context/SignupContext'

function DashboardPage() {
  const { selectedRole } = useSignup()

  if (!selectedRole) {
    return <Navigate to="/signup" replace />
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center py-[40px] px-[20px] bg-[#f6f8fb]">
      <section className="w-full max-w-[520px] bg-white border border-[#e5e7eb] rounded-[16px] shadow-[0_1px_2px_rgba(17,24,39,0.06),0_8px_20px_rgba(17,24,39,0.06)] p-[28px] text-center">
        <p className="m-0 text-[12px] tracking-[0.08em] uppercase text-[#475467] font-bold">Welcome</p>
        <h1 className="my-[10px] text-[clamp(2rem,4vw,2.4rem)] leading-[1.15] tracking-[-0.02em] text-[#111827]">Dashboard</h1>
        <p className="m-0 text-[#6b7280] text-[1rem] leading-[1.6]">
          Signup complete for <strong>{selectedRole}</strong>.
        </p>
      </section>
    </main>
  )
}

export default DashboardPage
