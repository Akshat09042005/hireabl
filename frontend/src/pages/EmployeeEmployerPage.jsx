import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'live.com', 'protonmail.com', 'ymail.com']

function extractDomain(email) {
  const match = String(email || '').trim().match(/@(.+)$/)
  return match ? match[1].toLowerCase() : ''
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function EmployeeEmployerPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    employerName: '',
    hrEmail: '',
    managerEmail: '',
    ceoEmail: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Step 1 + Step 2 counts for progress
  const [step1Count, setStep1Count] = useState(5)
  const [step2Count, setStep2Count] = useState(3)

  useEffect(() => {
    try {
      const s1 = JSON.parse(localStorage.getItem('step1Data'))
      if (s1) {
        const fields = [s1.name, s1.phone, s1.country, s1.city]
        setStep1Count(fields.filter(Boolean).length + 1)
      }
    } catch (_) {}
    try {
      const s2 = JSON.parse(localStorage.getItem('step2Data'))
      if (s2) {
        const fields = [s2.qualification, s2.designation, s2.skills?.length > 0]
        setStep2Count(fields.filter(Boolean).length)
      }
    } catch (_) {}
  }, [])

  const step1Completion = useMemo(() => Math.round((step1Count / 5) * 33), [step1Count])
  const step2Completion = useMemo(() => Math.round((step2Count / 3) * 33), [step2Count])
  const step3Completion = useMemo(() => {
    const filled = [form.employerName.trim(), form.hrEmail.trim()].filter(Boolean).length
    return Math.round((filled / 2) * 34)
  }, [form.employerName, form.hrEmail])
  const totalCompletion = Math.min(step1Completion + step2Completion + step3Completion, 100)

  const isContinueDisabled = useMemo(
    () => submitting || !form.employerName.trim() || !form.hrEmail.trim(),
    [submitting, form.employerName, form.hrEmail],
  )

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errors = {}
    if (!form.employerName.trim()) errors.employerName = 'Employer name is required'

    if (!form.hrEmail.trim()) {
      errors.hrEmail = 'HR Email is required'
    } else if (!isValidEmail(form.hrEmail)) {
      errors.hrEmail = 'Enter a valid email address'
    }

    const hrDomain = extractDomain(form.hrEmail)
    const emailsToCheck = [
      { field: 'managerEmail', value: form.managerEmail },
      { field: 'ceoEmail', value: form.ceoEmail },
    ]

    for (const { field, value } of emailsToCheck) {
      if (!value.trim()) continue
      if (!isValidEmail(value)) {
        errors[field] = 'Enter a valid email address'
        continue
      }
      const domain = extractDomain(value)
      if (hrDomain && domain !== hrDomain) {
        errors[field] = 'All emails must belong to the same company domain'
      }
    }

    // Also warn if HR email is a personal domain (not block, just flag)
    if (hrDomain && PERSONAL_DOMAINS.includes(hrDomain)) {
      errors.hrEmail = errors.hrEmail || 'Please use a company email address'
    }

    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const data = {
      employerName: form.employerName.trim(),
      hrEmail: form.hrEmail.trim(),
      managerEmail: form.managerEmail.trim(),
      ceoEmail: form.ceoEmail.trim(),
    }

    localStorage.setItem('step3Data', JSON.stringify(data))
    navigate('/employee/review')
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-['Inter']">
      {/* Top Header Strip */}
      <header className="w-full bg-white border-b border-[#e5e7eb] h-20 flex items-center justify-between px-10">
        <img src="/logo.jpg" alt="Hireabl" className="h-12 w-auto object-contain rounded" />
      </header>

      <main className="flex items-start justify-center min-h-[calc(100vh-80px)] py-8 px-4">
        <section className="w-full max-w-lg bg-white rounded-xl shadow-md p-6 md:p-8">

          {/* Header */}
          <div className="text-center mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Employer Details</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Step 3 of 4 · Verify your employer</p>
          </div>

          {/* Progress */}
          <div className="mt-4 mb-6">
            <div className="flex justify-between text-xs text-[#6b7280] mb-1.5">
              <span>Profile Completion</span>
              <span className="font-semibold text-[#2563eb]">{totalCompletion}%</span>
            </div>
            <div className="w-full bg-[#e5e7eb] rounded-full h-1.5">
              <div
                className="bg-[#2563eb] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${totalCompletion}%` }}
              />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Employer Name */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Employer Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.employerName ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.employerName}
                onChange={handleChange('employerName')}
                placeholder="e.g. Acme Corporation"
              />
              {fieldErrors.employerName && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.employerName}</p>}
            </div>

            {/* HR Email */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                HR Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.hrEmail ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.hrEmail}
                onChange={handleChange('hrEmail')}
                placeholder="hr@company.com"
              />
              {fieldErrors.hrEmail && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.hrEmail}</p>}
            </div>

            {/* Manager Email */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Manager Email ID{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <input
                type="email"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.managerEmail ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.managerEmail}
                onChange={handleChange('managerEmail')}
                placeholder="manager@company.com"
              />
              {fieldErrors.managerEmail && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.managerEmail}</p>}
            </div>

            {/* CEO Email */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                CEO Email ID{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <input
                type="email"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.ceoEmail ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.ceoEmail}
                onChange={handleChange('ceoEmail')}
                placeholder="ceo@company.com"
              />
              {fieldErrors.ceoEmail && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.ceoEmail}</p>}
            </div>

            <p className="text-xs text-[#9ca3af] mt-1">
              All email addresses must belong to the same company domain.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/employee/professional')}
                className="flex-1 rounded-lg border border-[#d1d5db] px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isContinueDisabled}
                className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </span>
                ) : 'Review & Continue →'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default EmployeeEmployerPage
