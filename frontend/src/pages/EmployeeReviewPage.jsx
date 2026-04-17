import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Pencil, Loader2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-[#f3f4f6] last:border-0">
      <span className="text-xs text-[#9ca3af] w-36 shrink-0">{label}</span>
      <span className="text-sm text-[#111827] font-medium break-all">{value}</span>
    </div>
  )
}

function SectionCard({ title, onEdit, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-[#22c55e]" />
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] transition"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
      <div className="px-4 py-1">
        {children}
      </div>
    </div>
  )
}

function EditConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-2">Edit this step?</h2>
        <p className="text-sm text-[#6b7280] mb-6">
          Are you sure you want to edit this step? Your progress may be affected.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

function EmployeeReviewPage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()

  let step1 = {}
  let step2 = {}
  let step3 = {}

  try { step1 = JSON.parse(localStorage.getItem('step1Data')) || {} } catch (_) {}
  try { step2 = JSON.parse(localStorage.getItem('step2Data')) || {} } catch (_) {}
  try { step3 = JSON.parse(localStorage.getItem('step3Data')) || {} } catch (_) {}

  const handleEdit = (path) => setModal(path)
  const confirmEdit = () => { navigate(modal); setModal(null) }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      const res = await fetch(`${BACKEND_URL}/api/v1/employee/employer-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(step3)
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(getErrorMessage(json, 'Submission failed'))
      }

      localStorage.removeItem('step1Data')
      localStorage.removeItem('step2Data')
      localStorage.removeItem('step3Data')
      localStorage.removeItem('resumeData')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-['Inter']">
      {/* Header */}
      <header className="w-full bg-white flex items-center justify-between px-8 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo-nobg.png" alt="Hireabl Logo" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-[poppins] font-medium text-blue-700 tracking-tight cursor-default">hireabl</span>
        </div>
        <div className="text-sm font-medium text-[#4b5563]">
          Need help?{' '}
          <a href="mailto:support@hireabl.com" className="text-[#2563eb] font-semibold hover:underline">
            Contact Support
          </a>
        </div>
      </header>

      {/* Edit Confirmation Modal */}
      {modal && (
        <EditConfirmModal
          onCancel={() => setModal(null)}
          onConfirm={confirmEdit}
        />
      )}

      <main className="flex justify-center w-full max-w-[1050px] mx-auto px-6 pb-16">
        <div className="flex flex-col md:flex-row w-full bg-white rounded-[24px] shadow-sm overflow-hidden min-h-[600px] border border-[#f1f1f1]">
          
          {/* Left Form Section */}
          <section className="flex-1 w-full p-8 md:p-12 lg:p-14 flex flex-col justify-center space-y-4">

            <div className="mb-10 text-center">
              <h1 className="text-[32px] font-bold text-[#111827] mb-3">Review Profile</h1>
              <p className="text-[14px] text-[#6b7280]">
                Confirm your details before concluding your onboarding.
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold ${s === 4 ? 'bg-black text-white' : s < 4 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s < 4 ? <Check size={16} /> : s}
                  </div>
                  {s < 4 && <div className={`w-6 sm:w-10 h-1 mx-2 rounded-full ${s < 4 ? 'bg-black' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

          {/* Section 1 — Basic Info */}
          <SectionCard title="Basic Info" onEdit={() => handleEdit('/employee/onboarding')}>
            <ReviewRow label="Name" value={step1.name} />
            <ReviewRow label="Phone" value={step1.phone} />
            <ReviewRow label="Country" value={step1.country} />
            <ReviewRow label="City" value={step1.city} />
          </SectionCard>

          {/* Section 2 — Professional Details */}
          <SectionCard title="Professional Details" onEdit={() => handleEdit('/employee/professional')}>
            <ReviewRow label="Qualification" value={step2.qualification} />
            <ReviewRow label="Company Name" value={step2.companyName} />
            <ReviewRow label="Designation" value={step2.designation} />
            <ReviewRow
              label="Years of Exp."
              value={step2.yearsOfExperience !== '' && step2.yearsOfExperience !== undefined
                ? `${step2.yearsOfExperience} years`
                : null}
            />
            <ReviewRow
              label="Skills"
              value={Array.isArray(step2.skills) && step2.skills.length > 0
                ? step2.skills.join(', ')
                : null}
            />
          </SectionCard>

          {/* Section 3 — Employer Details */}
          <SectionCard title="Employer Details" onEdit={() => handleEdit('/employee/employer-details')}>
            <ReviewRow label="Employer Name" value={step3.employerName} />
            <ReviewRow label="HR Email" value={step3.hrEmail} />
            <ReviewRow label="Manager Email" value={step3.managerEmail} />
            <ReviewRow label="CEO Email" value={step3.ceoEmail} />
          </SectionCard>

          {error && <div className="text-sm text-red-500 mb-2 px-1">{error}</div>}
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employee/employer-details')}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-[#d1d5db] px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit & Continue →'}
            </button>
            </div>
          </section>

          {/* Right Section (Illustration) */}
          <section className="hidden md:flex flex-col items-center justify-center p-8 bg-[#f9faff] w-[380px] shrink-0 border-l border-[#f1f1f1]">
             <img src="/logo-nobg.png" alt="Hireabl Illustration" className="w-[180px] opacity-20 mb-8" />
             <div className="text-center px-6">
                <h3 className="text-[18px] font-bold text-[#111827] mb-3">Ready to launch!</h3>
                <p className="text-[14px] text-[#6b7280] leading-relaxed">
                  Take a final look at your profile. We'll use this information to match you with top companies directly on our platform.
                </p>
             </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default EmployeeReviewPage
