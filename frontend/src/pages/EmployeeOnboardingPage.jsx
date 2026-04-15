import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

function EmployeeOnboardingPage() {
  const navigate = useNavigate()
  const { token, user: authUser } = useAuth()

  useEffect(() => {
    if (!authUser) return
    if (authUser.role !== 'employee') {
      navigate('/employer/onboarding', { replace: true })
    }
  }, [authUser, navigate])

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    profilePhoto: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldRefs = useRef({})
  const [editableName, setEditableName] = useState(false)

  // Phone confirmation modal
  const [showPhoneModal, setShowPhoneModal] = useState(false)

  const setFieldRef = (field) => (el) => {
    fieldRefs.current[field] = el
  }

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        setLoadingProfile(true)
        setError('')
        const res = await fetch(`${BACKEND_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const msg = await getErrorMessage(res, 'Failed to load profile')
          throw new Error(msg)
        }
        const data = await res.json()
        const dbUser = data?.data?.user || {}
        if (!cancelled) {
          setProfile({
            name: dbUser.name || '',
            email: dbUser.email || authUser?.email || '',
            phone: dbUser.phone || '',
            country: dbUser.country || '',
            city: dbUser.city || '',
            profilePhoto: dbUser.profilePhoto || '',
          })
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }

    if (token) {
      loadProfile()
    } else {
      setLoadingProfile(false)
    }

    return () => { cancelled = true }
  }, [token, authUser?.email])

  useEffect(() => {
    if (loadingProfile) return
    const focusOrder = ['country', 'city']
    const firstEmpty = focusOrder.find((key) => !String(profile[key] || '').trim())
    if (firstEmpty && fieldRefs.current[firstEmpty]) {
      fieldRefs.current[firstEmpty].focus()
    }
  }, [loadingProfile, profile])

  useEffect(() => {
    if (editableName) fieldRefs.current.name?.focus()
  }, [editableName])

  // Step 1 progress: each filled field contributes equally, up to 50% of total
  const completion = useMemo(() => {
    const step1Fields = [
      String(profile.name || '').trim(),
      String(profile.phone || '').trim(),
      String(profile.country || '').trim(),
      String(profile.city || '').trim(),
      resumeFile,
    ]
    return Math.round((step1Fields.filter(Boolean).length / step1Fields.length) * 50)
  }, [profile.name, profile.phone, profile.country, profile.city, resumeFile])

  const isContinueDisabled = useMemo(
    () => (
      submitting ||
      loadingProfile ||
      !profile.name.trim() ||
      !profile.phone.trim() ||
      !profile.country.trim() ||
      !profile.city.trim() ||
      !resumeFile
    ),
    [submitting, loadingProfile, profile.name, profile.phone, profile.country, profile.city, resumeFile],
  )

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setProfile((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const toTitleCase = (value) =>
    value.toLowerCase().split(' ').filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')

  const handleNameBlur = () => {
    const formatted = toTitleCase(profile.name.trim())
    if (formatted && formatted !== profile.name) {
      setProfile((prev) => ({ ...prev, name: formatted }))
    }
  }

  const validateAndSetResume = (file) => {
    if (!file) return
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(file.type)) {
      setError('Please upload a valid resume file (PDF, DOC, or DOCX)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Resume file must be under 2 MB')
      return
    }
    setResumeFile(file)
    if (error) setError('')
  }

  const handleResumeChange = (e) => validateAndSetResume(e.target.files?.[0])
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    validateAndSetResume(e.dataTransfer.files?.[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: toTitleCase(profile.name.trim()),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      country: profile.country.trim(),
      city: profile.city.trim(),
    }

    const nextFieldErrors = {}
    if (!payload.name)    nextFieldErrors.name = 'Name is required'
    if (!payload.phone)   nextFieldErrors.phone = 'Phone is required'
    if (!payload.country) nextFieldErrors.country = 'Country is required'
    if (!payload.city)    nextFieldErrors.city = 'City is required'
    if (!resumeFile)      nextFieldErrors.resume = 'Resume is required'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      const firstErrorField = ['name', 'phone', 'country', 'city', 'resume'].find((k) => nextFieldErrors[k])
      if (firstErrorField && fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField].scrollIntoView({ behavior: 'smooth', block: 'center' })
        fieldRefs.current[firstErrorField].focus()
      }
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setFieldErrors({})
      const res = await fetch(`${BACKEND_URL}/api/v1/employee/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, profilePhoto: profile.profilePhoto || '' }),
      })
      if (!res.ok) {
        const msg = await getErrorMessage(res, 'Request failed')
        throw new Error(msg)
      }
      // Persist Step 1 data before navigating
      localStorage.setItem('step1Data', JSON.stringify({
        name: payload.name,
        phone: payload.phone,
        country: payload.country,
        city: payload.city,
      }))
      navigate('/employee/professional')
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = profile.name || authUser?.name || authUser?.email?.split('@')[0] || 'there'

  return (
    <main
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative font-['Inter']"
      style={{ backgroundImage: `url('/signupbackground.jpg')` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Phone Confirmation Modal */}
      {showPhoneModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPhoneModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#374151]"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold text-[#111827] mb-2">Verification Required</h2>
            <p className="text-sm text-[#6b7280] mb-6">
              Changing this field requires re-verification. You will be redirected to verification.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/verify-otp?next=/employee/onboarding')}
                className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full h-screen flex items-center justify-center p-4 animate-signup-fade-in">
        <section className="w-full max-w-lg md:max-w-xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/30 max-h-[95vh] flex flex-col overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">
              {loadingProfile ? 'Welcome!' : `Welcome, ${displayName.split(' ')[0]} 👋`}
            </h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Step 1 of 2 · Basic Info</p>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <p className="text-sm text-[#6b7280] text-center mb-2">
              Profile Completion: <span className="font-semibold text-[#2563eb]">{completion}%</span>
            </p>
            <div className="w-full bg-[#e5e7eb] rounded-full h-2">
              <div
                className="bg-[#2563eb] h-2 rounded-full transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>

            {/* Resume Upload — drag & drop */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Resume <span className="text-red-500">*</span>
              </label>
              <label
                className={`flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed px-4 py-4 cursor-pointer transition-colors duration-200 ${
                  isDragOver
                    ? 'border-[#2563eb] bg-[#eff6ff]'
                    : resumeFile
                    ? 'border-[#2563eb] bg-[#f0fdf4]'
                    : 'border-[#d1d5db] bg-white hover:border-[#2563eb] hover:bg-[#f8faff]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {resumeFile ? (
                  <>
                    <span className="text-2xl mb-1">📄</span>
                    <p className="text-sm font-medium text-[#2563eb] truncate max-w-full">{resumeFile.name}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB · Click to replace</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mb-1">📂</span>
                    <p className="text-sm font-medium text-[#374151]">Drag & drop your resume here</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">or <span className="text-[#2563eb] underline">browse files</span> · PDF, DOC, DOCX · Max 2 MB</p>
                  </>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={setFieldRef('name')}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none ${
                    editableName
                      ? 'border-[#2563eb] bg-white text-[#111827]'
                      : 'border-[#d1d5db] bg-[#f3f4f6] text-[#6b7280]'
                  } ${fieldErrors.name ? '!border-[#ef4444]' : ''}`}
                  value={profile.name}
                  onChange={handleChange('name')}
                  onBlur={handleNameBlur}
                  placeholder="Enter your full name"
                  disabled={!editableName}
                />
                <button
                  type="button"
                  onClick={() => setEditableName(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#2563eb]"
                  aria-label="Edit name"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {fieldErrors.name && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.name}</p>}
            </div>

            {/* Email — permanently locked */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
              <input
                className="w-full rounded-lg border border-[#d1d5db] bg-[#f3f4f6] px-3 py-2.5 text-sm text-[#6b7280] outline-none cursor-not-allowed"
                value={profile.email}
                placeholder="Email"
                disabled
                readOnly
              />
            </div>

            {/* Phone — modal on pencil click */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-[#d1d5db] bg-[#f3f4f6] px-3 py-2.5 pr-10 text-sm text-[#6b7280] outline-none"
                  value={profile.phone}
                  placeholder="+91XXXXXXXXXX"
                  disabled
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#2563eb]"
                  aria-label="Change phone number"
                  title="Change phone number"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>

            {/* Country + City side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('country')}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.country ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                  value={profile.country}
                  onChange={handleChange('country')}
                  placeholder="Country"
                />
                {fieldErrors.country && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.country}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('city')}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                  value={profile.city}
                  onChange={handleChange('city')}
                  placeholder="City"
                />
                {fieldErrors.city && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.city}</p>}
              </div>
            </div>

            {error && <p className="text-sm text-[#b42318]">{error}</p>}

            <button
              type="submit"
              disabled={isContinueDisabled}
              className="w-full rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </span>
              ) : loadingProfile ? 'Loading...' : 'Save & Continue →'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default EmployeeOnboardingPage
