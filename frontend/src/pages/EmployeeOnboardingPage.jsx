import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

function EmployeeOnboardingPage() {
  const navigate = useNavigate()
  const { token, user: authUser } = useAuth()

  useEffect(() => {
    if (!authUser) return
    console.log('User Role:', authUser.role)
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
    qualification: '',
    companyName: '',
    profilePhoto: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldRefs = useRef({})
  const [editableFields, setEditableFields] = useState({
    name: false,
    phone: false,
  })

  const setFieldRef = (field) => (el) => {
    fieldRefs.current[field] = el
  }

  const enableEdit = (field) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: true,
    }))
  }

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        setLoadingProfile(true)
        setError('')
        const res = await fetch(`${BACKEND_URL}/api/v1/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          const msg = await getErrorMessage(res, 'Failed to load profile')
          throw new Error(msg)
        }
        const data = await res.json()
        console.log('User Data:', data)

        const dbUser = data?.data?.user || {}
        if (!cancelled) {
          setProfile({
            name: dbUser.name || '',
            email: dbUser.email || authUser?.email || '',
            phone: dbUser.phone || '',
            country: dbUser.country || '',
            city: dbUser.city || '',
            qualification: dbUser.qualification || '',
            companyName: dbUser.companyName || '',
            profilePhoto: dbUser.profilePhoto || '',
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load profile')
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false)
        }
      }
    }

    if (token) {
      loadProfile()
    } else {
      setLoadingProfile(false)
    }

    return () => {
      cancelled = true
    }
  }, [token, authUser?.email])

  useEffect(() => {
    if (loadingProfile) return
    const focusOrder = ['country', 'city', 'qualification', 'companyName']
    const firstEmpty = focusOrder.find((key) => !String(profile[key] || '').trim())
    if (firstEmpty && fieldRefs.current[firstEmpty]) {
      fieldRefs.current[firstEmpty].focus()
    }
  }, [loadingProfile, profile])

  useEffect(() => {
    if (editableFields.name) fieldRefs.current.name?.focus()
  }, [editableFields.name])

  // Profile completion calculation
  const { completion, filledFields } = useMemo(() => {
    const fields = [profile.name, profile.phone, profile.country, profile.city, profile.qualification, profile.companyName]
    const filled = fields.filter((f) => String(f || '').trim()).length
    return { completion: Math.round((filled / fields.length) * 100), filledFields: filled }
  }, [profile.name, profile.phone, profile.country, profile.city, profile.qualification, profile.companyName])

  const isContinueDisabled = useMemo(
    () => (
      submitting ||
      loadingProfile ||
      !profile.name.trim() ||
      !profile.phone.trim() ||
      !profile.country.trim() ||
      !profile.city.trim() ||
      !profile.qualification.trim() ||
      !profile.companyName.trim()
    ),
    [submitting, loadingProfile, profile.name, profile.phone, profile.country, profile.city, profile.qualification, profile.companyName],
  )

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setProfile((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const toTitleCase = (value) => value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  const handleNameBlur = () => {
    const formatted = toTitleCase(profile.name.trim())
    if (formatted && formatted !== profile.name) {
      setProfile((prev) => ({ ...prev, name: formatted }))
    }
  }

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: toTitleCase(profile.name.trim()),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      country: profile.country.trim(),
      city: profile.city.trim(),
      qualification: profile.qualification.trim(),
      companyName: profile.companyName.trim(),
    }

    const nextFieldErrors = {}
    if (!payload.name) nextFieldErrors.name = 'Name is required'
    if (!payload.country) nextFieldErrors.country = 'Country is required'
    if (!payload.city) nextFieldErrors.city = 'City is required'
    if (!payload.qualification) nextFieldErrors.qualification = 'Qualification is required'
    if (!payload.companyName) nextFieldErrors.companyName = 'Company name is required'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      const firstErrorField = ['name', 'country', 'city', 'qualification', 'companyName']
        .find((key) => nextFieldErrors[key])
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
        body: JSON.stringify({
          ...payload,
          profilePhoto: profile.profilePhoto || '',
        }),
      })
      if (!res.ok) {
        const msg = await getErrorMessage(res, 'Request failed')
        throw new Error(msg)
      }

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
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full h-screen flex items-center justify-center p-4 animate-signup-fade-in">
        <section className="w-full max-w-lg md:max-w-xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/30 max-h-[95vh] flex flex-col overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">
              {loadingProfile ? 'Welcome!' : `Welcome, ${displayName.split(' ')[0]} 👋`}
            </h1>
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

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Resume <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151] outline-none file:mr-3 file:rounded file:border-0 file:bg-[#eff6ff] file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#2563eb] hover:file:bg-[#dbeafe] cursor-pointer"
                onChange={handleResumeChange}
              />
              <p className="text-xs text-[#6b7280] mt-1">
                {resumeFile ? `Selected: ${resumeFile.name}` : 'PDF, DOC, DOCX · Max 2 MB'}
              </p>
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
                    editableFields.name
                      ? 'border-[#2563eb] bg-white text-[#111827]'
                      : 'border-[#d1d5db] bg-[#f3f4f6] text-[#6b7280]'
                  } ${fieldErrors.name ? 'border-[#ef4444]' : ''}`}
                  value={profile.name}
                  onChange={handleChange('name')}
                  onBlur={handleNameBlur}
                  placeholder="Enter your full name"
                  disabled={!editableFields.name}
                />
                <button
                  type="button"
                  onClick={() => enableEdit('name')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#2563eb]"
                  aria-label="Edit name"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {fieldErrors.name && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.name}</p>}
            </div>

            {/* Email — permanently disabled, no edit */}
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

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={setFieldRef('phone')}
                  className="w-full rounded-lg border border-[#d1d5db] bg-[#f3f4f6] px-3 py-2.5 pr-10 text-sm text-[#6b7280] outline-none"
                  value={profile.phone}
                  onChange={handleChange('phone')}
                  placeholder="+91XXXXXXXXXX"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => navigate('/verify-otp?next=/employee/onboarding')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#2563eb]"
                  aria-label="Verify phone number"
                  title="Verify phone number"
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

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef('qualification')}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.qualification ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={profile.qualification}
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
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.companyName ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                value={profile.companyName}
                onChange={handleChange('companyName')}
                placeholder="Enter company name"
              />
              {fieldErrors.companyName && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.companyName}</p>}
            </div>



            {error && (
              <p className="text-sm text-[#b42318]">{error}</p>
            )}

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
              ) : loadingProfile ? 'Loading...' : 'Save & Continue'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default EmployeeOnboardingPage
