import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Loader2, X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

const SKILL_OPTIONS = [
  'Software Development',
  'Web Development',
  'Mobile App Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cybersecurity',
  'Cloud Computing & DevOps',
  'Database Management',
  'IT Support & Networking',
  'QA & Testing',
  'Sales',
  'Business Development',
  'Marketing',
  'Digital Marketing',
  'Operations Management',
  'Project Management',
  'Product Management',
  'Strategy & Consulting',
  'Entrepreneurship',
  'Accounting',
  'Financial Analysis',
  'Auditing',
  'Taxation',
  'Investment & Wealth Management',
  'Banking Operations',
  'Recruitment',
  'Talent Acquisition',
  'Employee Engagement',
  'Payroll & Compliance',
  'Training & Development',
  'Administration',
  'Graphic Design',
  'UI/UX Design',
  'Animation & Motion Graphics',
  'Video Editing',
  'Content Writing',
  'Copywriting',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Production & Manufacturing',
  'Quality Control',
  'Maintenance & Operations',
  'Customer Support',
  'Customer Success',
  'Technical Support',
  'Client Relationship Management',
  'Procurement & Purchasing',
  'Inventory Management',
  'Logistics & Distribution',
  'Warehouse Management',
  'Medical Practice',
  'Nursing',
  'Pharmacy',
  'Healthcare Administration',
  'Biotechnology & Research',
  'Data Entry',
  'Research & Analysis',
  'Field Operations',
  'Freelancing',
  'Multi-Skilled / Generalist',
  'Legal Advisory',
  'Compliance & Risk Management',
  'Contract Management',
]

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function EmployeeProfessionalPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [form, setForm] = useState({
    qualification: '',
    companyName: '',
    designation: '',
    yearsOfExperience: '',
    workEmail: '',
  })
  const [selectedSkills, setSelectedSkills] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')
  const dropdownRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setSkillSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Pre-fill from DB
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
          setForm((prev) => ({
            qualification: dbUser.qualification || prev.qualification,
            companyName: dbUser.companyName || prev.companyName,
            designation: dbUser.designation || prev.designation,
            yearsOfExperience: dbUser.yearsOfExperience !== undefined && dbUser.yearsOfExperience !== null
              ? String(dbUser.yearsOfExperience)
              : prev.yearsOfExperience,
            workEmail: dbUser.workEmail || prev.workEmail,
          }))
          if (Array.isArray(dbUser.skills) && dbUser.skills.length > 0) {
            setSelectedSkills(dbUser.skills)
          }
        }
      } catch (_) {
        // silently ignore
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [token])

  // Auto-fill from resume data (only if fields are empty)
  useEffect(() => {
    try {
      const resumeData = JSON.parse(localStorage.getItem('resumeData'))
      if (resumeData) {
        setForm((prev) => ({
          ...prev,
          qualification: prev.qualification || resumeData.qualification || '',
        }))
        setSelectedSkills((prev) =>
          prev.length === 0 && Array.isArray(resumeData.skills) ? resumeData.skills : prev
        )
      }
    } catch (_) {}
  }, [])

  // Step 1 count for progress
  const [step1FieldCount, setStep1FieldCount] = useState(5)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('step1Data'))
      if (saved) {
        const fields = [saved.name, saved.phone, saved.country, saved.city]
        setStep1FieldCount(fields.filter(Boolean).length + 1)
      }
    } catch (_) {}
  }, [])

  const step1Completion = useMemo(() => Math.round((step1FieldCount / 5) * 33), [step1FieldCount])

  const step2Completion = useMemo(() => {
    const step2Fields = [
      form.qualification.trim(),
      form.companyName.trim(),
      form.designation.trim(),
      selectedSkills.length > 0,
    ]
    return Math.round((step2Fields.filter(Boolean).length / step2Fields.length) * 33)
  }, [form.qualification, form.companyName, form.designation, selectedSkills])

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

  const filteredSkills = SKILL_OPTIONS.filter(
    (s) => s.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(s)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextFieldErrors = {}
    if (!form.qualification.trim()) nextFieldErrors.qualification = 'Qualification is required'
    if (!form.companyName.trim())   nextFieldErrors.companyName = 'Company name is required'
    if (!form.designation.trim())   nextFieldErrors.designation = 'Designation is required'
    if (selectedSkills.length === 0) nextFieldErrors.skills = 'Select at least one skill'
    if (form.workEmail.trim() && !isValidEmail(form.workEmail)) {
      nextFieldErrors.workEmail = 'Enter a valid email address'
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    const payload = {
      qualification: form.qualification.trim(),
      companyName: form.companyName.trim(),
      designation: form.designation.trim(),
      skills: selectedSkills,
      ...(form.yearsOfExperience !== '' && { yearsOfExperience: Number(form.yearsOfExperience) }),
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
        // Parse error but show a clean message to the user
        let serverMsg = 'Something went wrong. Please try again.'
        try {
          const json = await res.json()
          if (json?.message && !json.message.toLowerCase().includes('route')) {
            serverMsg = json.message
          }
        } catch (_) {}
        throw new Error(serverMsg)
      }
      // Save step 2 data for review page
      localStorage.setItem('step2Data', JSON.stringify({
        qualification: payload.qualification,
        companyName: payload.companyName,
        designation: payload.designation,
        yearsOfExperience: form.yearsOfExperience,
        skills: selectedSkills,
      }))
      navigate('/employee/employer-details')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
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

      <main className="flex justify-center w-full max-w-[1050px] mx-auto px-6 pb-16">
        <div className="flex flex-col md:flex-row w-full bg-white rounded-[24px] shadow-sm overflow-hidden min-h-[600px] border border-[#f1f1f1]">
          
          {/* Left Form Section */}
          <section className="flex-1 w-full p-8 md:p-12 lg:p-14 flex flex-col justify-center">

            <div className="mb-10 text-center">
              <h1 className="text-[32px] font-bold text-[#111827] mb-3">Professional Details</h1>
              <p className="text-[14px] text-[#6b7280]">
                Tell us about your career and skills.
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold ${s === 2 ? 'bg-black text-white' : s < 2 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s < 2 ? <Check size={16} /> : s}
                  </div>
                  {s < 4 && <div className={`w-6 sm:w-10 h-1 mx-2 rounded-full ${s < 2 ? 'bg-black' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.qualification ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.qualification}
                onChange={handleChange('qualification')}
                placeholder="e.g. B.Tech, MBA, B.Com"
              />
              {fieldErrors.qualification && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.qualification}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.companyName ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.companyName}
                onChange={handleChange('companyName')}
                placeholder="Enter your current company name"
              />
              {fieldErrors.companyName && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.companyName}</p>}
            </div>

            {/* Designation + Years of Experience side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.designation ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                  value={form.designation}
                  onChange={handleChange('designation')}
                  placeholder="e.g. Software Engineer"
                />
                {fieldErrors.designation && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.designation}</p>}
              </div>

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
            </div>

            {/* Primary Skills — Dropdown multi-select */}
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

              {/* Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition-colors duration-200 ${
                    fieldErrors.skills ? 'border-[#ef4444]' : dropdownOpen ? 'border-[#2563eb]' : 'border-[#d1d5db]'
                  } text-[#6b7280] hover:border-[#2563eb]`}
                >
                  <span>
                    {selectedSkills.length > 0
                      ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
                      : 'Select skills'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-[#e5e7eb] rounded-lg shadow-lg max-h-52 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-[#f3f4f6]">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        className="w-full px-2 py-1.5 text-sm border border-[#d1d5db] rounded-md outline-none focus:border-[#2563eb]"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto">
                      {filteredSkills.length === 0 ? (
                        <p className="text-xs text-[#9ca3af] px-3 py-3 text-center">No skills found</p>
                      ) : (
                        filteredSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => { toggleSkill(skill); setSkillSearch('') }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#f0f9ff] hover:text-[#2563eb] transition-colors"
                          >
                            {skill}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {fieldErrors.skills && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.skills}</p>}
            </div>

            {/* Work Email — optional */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Work Email{' '}
                <span className="text-xs font-normal text-[#9ca3af]">(Optional)</span>
              </label>
              <input
                type="email"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] transition-colors duration-200 ${fieldErrors.workEmail ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={form.workEmail}
                onChange={handleChange('workEmail')}
                placeholder="Enter your work email (optional)"
              />
              {fieldErrors.workEmail && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.workEmail}</p>}
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

          {/* Right Section (Illustration) */}
          <section className="hidden md:flex flex-col items-center justify-center p-8 bg-[#f9faff] w-[380px] shrink-0 border-l border-[#f1f1f1]">
             <img src="/logo-nobg.png" alt="Hireabl Illustration" className="w-[180px] opacity-20 mb-8" />
             <div className="text-center px-6">
                <h3 className="text-[18px] font-bold text-[#111827] mb-3">Level up your profile</h3>
                <p className="text-[14px] text-[#6b7280] leading-relaxed">
                  Companies love detailed profiles. By adding your skills and experience, you stand out significantly in our talent network.
                </p>
             </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default EmployeeProfessionalPage
