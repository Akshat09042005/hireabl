import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Pencil } from 'lucide-react'

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

function EmployeeReviewPage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)

  let step1 = {}
  let step2 = {}
  let step3 = {}

  try { step1 = JSON.parse(localStorage.getItem('step1Data')) || {} } catch (_) {}
  try { step2 = JSON.parse(localStorage.getItem('step2Data')) || {} } catch (_) {}
  try { step3 = JSON.parse(localStorage.getItem('step3Data')) || {} } catch (_) {}

  const handleEdit = (path) => setModal(path)
  const confirmEdit = () => { navigate(modal); setModal(null) }

  const handleSubmit = () => {
    localStorage.removeItem('step1Data')
    localStorage.removeItem('step2Data')
    localStorage.removeItem('step3Data')
    localStorage.removeItem('resumeData')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-['Inter']">
      {/* Top Header Strip */}
      <header className="w-full bg-white border-b border-[#e5e7eb] h-20 flex items-center justify-between px-10">
        <img src="/logo.jpg" alt="Hireabl" className="h-12 w-auto object-contain rounded" />
      </header>

      {/* Edit Confirmation Modal */}
      {modal && (
        <EditConfirmModal
          onCancel={() => setModal(null)}
          onConfirm={confirmEdit}
        />
      )}

      <main className="flex items-start justify-center min-h-[calc(100vh-80px)] py-8 px-4">
        <section className="w-full max-w-lg space-y-4">

          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Review Your Profile</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Step 4 of 4 · Confirm your details before submitting</p>
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employee/employer-details')}
              className="flex-1 rounded-lg border border-[#d1d5db] px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Submit & Continue →
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default EmployeeReviewPage
