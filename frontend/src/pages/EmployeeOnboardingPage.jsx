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
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldRefs = useRef({})
  const [editableFields, setEditableFields] = useState({
    name: false,
    email: false,
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
          setPhotoPreview(dbUser.profilePhoto || '')
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

  useEffect(() => {
    if (editableFields.email) fieldRefs.current.email?.focus()
  }, [editableFields.email])

  const isContinueDisabled = useMemo(
    () => (
      submitting ||
      loadingProfile ||
      !profile.country.trim() ||
      !profile.city.trim() ||
      !profile.qualification.trim() ||
      !profile.companyName.trim()
    ),
    [submitting, loadingProfile, profile.country, profile.city, profile.qualification, profile.companyName],
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

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setPhotoPreview(result)
    }
    reader.readAsDataURL(file)
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
    if (!payload.country) nextFieldErrors.country = 'Country is required'
    if (!payload.city) nextFieldErrors.city = 'City is required'
    if (!payload.qualification) nextFieldErrors.qualification = 'Qualification is required'
    if (!payload.companyName) nextFieldErrors.companyName = 'Company name is required'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      const firstErrorField = ['country', 'city', 'qualification', 'companyName']
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
          profilePhoto: photoPreview || profile.profilePhoto || '',
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

  return (
    <main 
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative font-['Inter']"
      style={{ backgroundImage: `url('/signupbackground.jpg')` }}
    >
      {/* Overlay for Readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full h-screen flex items-center justify-center p-4 animate-signup-fade-in">
        <section className="w-full max-w-lg md:max-w-xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/30 max-h-[95vh] flex flex-col overflow-y-auto sm:overflow-y-auto md:overflow-hidden">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Employee Onboarding</h1>
            <p className="mt-1 text-sm text-[#6b7280]">Step 1 of 3: Basic profile setup</p>
          </div>
          
          <div className="mt-3 flex justify-center">
            <div className="h-1.5 w-full max-w-xs rounded-full bg-[#e5e7eb]">
              <div className="h-1.5 w-1/3 rounded-full bg-[#2563eb]" />
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-[#d1d5db] bg-[#f3f4f6]">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#6b7280]">
                  No Photo
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoFile && <p className="text-xs text-[#6b7280]">{photoFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-[#374151] mb-1">Name</label>
            <div className="relative">
              <input
                ref={setFieldRef('name')}
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none ${
                  editableFields.name
                    ? 'border-[#2563eb] bg-white text-[#111827]'
                    : 'border-[#d1d5db] bg-[#f3f4f6] text-[#6b7280]'
                }`}
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
          </div>

          <div>
            <label className="block text-sm text-[#374151] mb-1">Email</label>
            <div className="relative">
              <input
                ref={setFieldRef('email')}
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none ${
                  editableFields.email
                    ? 'border-[#2563eb] bg-white text-[#111827]'
                    : 'border-[#d1d5db] bg-[#f3f4f6] text-[#6b7280]'
                }`}
                value={profile.email}
                onChange={handleChange('email')}
                placeholder="Enter your email"
                disabled={!editableFields.email}
              />
              <button
                type="button"
                onClick={() => enableEdit('email')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#2563eb]"
                aria-label="Edit email"
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#374151] mb-1">Phone</label>
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

          <div>
            <label className="block text-sm text-[#111827] mb-1">Country</label>
            <input
              ref={setFieldRef('country')}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.country ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
              value={profile.country}
              onChange={handleChange('country')}
              placeholder="Enter your country"
            />
            {fieldErrors.country && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.country}</p>}
          </div>

          <div>
            <label className="block text-sm text-[#111827] mb-1">City</label>
            <input
              ref={setFieldRef('city')}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
              value={profile.city}
              onChange={handleChange('city')}
              placeholder="Enter your city"
            />
            {fieldErrors.city && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.city}</p>}
          </div>

          <div>
            <label className="block text-sm text-[#111827] mb-1">Qualification</label>
            <input
              ref={setFieldRef('qualification')}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563eb] ${fieldErrors.qualification ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
              value={profile.qualification}
              onChange={handleChange('qualification')}
              placeholder="e.g. B.Tech, MBA"
            />
            {fieldErrors.qualification && <p className="mt-1 text-sm text-[#b42318]">{fieldErrors.qualification}</p>}
          </div>

          <div>
            <label className="block text-sm text-[#111827] mb-1">Company Name</label>
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
