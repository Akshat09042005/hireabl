import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

const SKILL_OPTIONS = ['C++', 'HTML', 'CSS', 'ReactJS', 'NodeJS', 'ExpressJS']

const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'HR',
  'Finance',
  'Other',
]

function EmployeeProfessionalPage() {
  const navigate = useNavigate()
  const { token, user: authUser } = useAuth()

  const [form, setForm] = useState({
    qualification: '',
    companyName: '',
    designation: '',
    yearsOfExperience: '',
    department: '',
    workEmail: '',
  })
  const [selectedSkills, setSelectedSkills] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldRefs = useRef({})

  // Fetch existing data to pre-fill if user comes back
  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function loadProfile() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const dbUser = data?.data?.user || {}
        if (!cancelled) {
          setForm({
            qualification: dbUser.qualification || '',
            companyName: dbUser.companyName || '',
            designation: dbUser.designation || '',
            yearsOfExperience: dbUser.yearsOfExperience !== undefined ? String(dbUser.yearsOfExperience) : '',
            department: dbUser.department || '',
            workEmail: dbUser.workEmail || '',
          })
          if (Array.isArray(dbUser.skills)) setSelectedSkills(dbUser.skills)
        }
      } catch (_) {
        // silently ignore; form starts empty
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [token])

  // Read Step 1 data from localStorage for progress calculation
  const [step1FieldCount, setStep1FieldCount] = useState(5) // assume all filled if reached Step 2
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('step1Data'))
      if (saved) {
        const fields = [saved.name, saved.phone, saved.country, saved.city]
        // 4 fields from localStorage + resume (assumed present since they passed Step 1)
        setStep1FieldCount(fields.filter(Boolean).length + 1)
      }
    } catch (_) {
      // ignore parse errors
    }
  }, [])

  // Step 2 progress: each filled field contributes equally, up to 50% of total
  const step2Completion = useMemo(() => {
    const step2Fields = [
      form.qualification.trim(),
      form.companyName.trim(),
      form.designation.trim(),
      selectedSkills.length > 0,
    ]
    return Math.round((step2Fields.filter(Boolean).length / step2Fields.length) * 50)
  }, [form.qualification, form.companyName, form.designation, selectedSkills])

  // Step 1 progress based on persisted data
  const step1Completion = useMemo(() => {
    return Math.round((step1FieldCount / 5) * 50)
  }, [step1FieldCount])

  const totalCompletion = Math.min(step1Completion + step2Completion, 100)

  const isContinueDisabled = useMemo(
    () => (
      submitting ||
      !form.qualification.trim() ||
      !form.companyName.trim() ||
      !form.designation.trim() ||
      selectedSkills.length === 0
    ),
    [submitting, form.qualification, form.companyName, form.designation, selectedSkills],
  )

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
    if (fieldErrors.skills) setFieldErrors((prev) => ({ ...prev, skills: '' }))
  }

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextFieldErrors = {}
    if (!form.qualification.trim()) nextFieldErrors.qualification = 'Qualification is required'
    if (!form.companyName.trim())   nextFieldErrors.companyName = 'Company name is required'
    if (!form.designation.trim())   nextFieldErrors.designation = 'Designation is required'
    if (selectedSkills.length === 0) nextFieldErrors.skills = 'Select at least one skill'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      const firstErrorField = ['qualification', 'companyName', 'designation'].find((k) => nextFieldErrors[k])
      if (firstErrorField && fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField].scrollIntoView({ behavior: 'smooth', block: 'center' })
        fieldRefs.current[firstErrorField].focus()
      }
      return
    }

    const payload = {
      qualification: form.qualification.trim(),
      companyName: form.companyName.trim(),
      designation: form.designation.trim(),
      skills: selectedSkills,
      ...(form.yearsOfExperience !== '' && { yearsOfExperience: Number(form.yearsOfExperience) }),
      ...(form.department && { department: form.department }),
      ...(form.workEmail.trim() && { workEmail: form.workEmail.trim() }),
    }

    try {
      setSubmitting(true)
      setError('')
      setFieldErrors({})
      const res = await fetch(`${BACKEND_URL}/api/v1/employee/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await getErrorMessage(res, 'Request failed')
        throw new Error(msg)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to save professional details')
    } finally {
      setSubmitting(false)
    }
  }

  const setFieldRef = (field) => (el) => { fieldRefs.current[field] = el }
  const displayName = authUser?.name || authUser?.email?.split('@')[0] || 'there'

  return (
    <main
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative font-['Inter']"
      style={{ backgroundImage: `url('/signupbackground.jpg')` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full h-screen flex items-center justify-center p-4 animate-signup-fade-in">
        <section className="w-full max-w-lg md:max-w-xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/30 max-h-[95vh] flex flex-col overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">
              Professional Details
            </h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Step 2 of 2 · Career Info</p>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <p className="text-sm text-[#6b7280] text-center mb-2">
              Profile Completion: <span className="font-semibold text-[#2563eb]">{totalCompletion}%</span>
            </p>
            <div className="w-full bg-[#e5e7eb] rounded-full h-2">
              <div
                className="bg-[#2563eb] h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCompletion}%` }}
              />
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef('qualification')}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.qualification ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.qualification}
                onChange={handleChange('qualification')}
                placeholder="e.g. B.Tech, MBA"
              />
              {fieldErrors.qualification && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.qualification}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef('companyName')}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.companyName ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.companyName}
                onChange={handleChange('companyName')}
                placeholder="Enter company name"
              />
              {fieldErrors.companyName && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.companyName}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef('designation')}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.designation ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.designation}
                onChange={handleChange('designation')}
                placeholder="e.g. Software Engineer, Product Manager"
              />
              {fieldErrors.designation && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.designation}</p>}
            </div>

            {/* Primary Skills — chip multi-select */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Primary Skills <span className="text-red-500">*</span>
              </label>

              {/* Selected skill tags */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] px-2.5 py-1 text-xs font-medium text-[#2563eb]"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-0.5 text-[#93c5fd] hover:text-[#2563eb]"
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skill chips to pick from */}
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const selected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                        selected
                          ? 'bg-[#2563eb] border-[#2563eb] text-white'
                          : 'bg-white border-[#d1d5db] text-[#374151] hover:border-[#2563eb] hover:text-[#2563eb]'
                      }`}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
              {fieldErrors.skills && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.skills}</p>}
            </div>

            {/* Years of Experience — optional */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Years of Experience{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200"
                value={form.yearsOfExperience}
                onChange={handleChange('yearsOfExperience')}
                placeholder="e.g. 3"
              />
            </div>

            {/* Department — optional dropdown */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Department{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <select
                className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 appearance-none"
                value={form.department}
                onChange={handleChange('department')}
              >
                <option value="">Select department</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Work Email — optional */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Work Email{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200"
                value={form.workEmail}
                onChange={handleChange('workEmail')}
                placeholder="work@company.com"
              />
            </div>

            {error && <p className="text-sm text-[#b42318]">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/employee/onboarding')}
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
                ) : 'Save & Continue →'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default EmployeeProfessionalPage
