import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'
import { Country, State, City } from 'country-state-city'

function EmployerOnboardingPage() {
  const navigate = useNavigate()
  const { token, user: authUser } = useAuth()
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'



  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneCode: '+91',
    phone: '',
    designation: '',
    roleInCompany: '',
    companyName: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    country: '',
    state: '',
    city: '',
    gstNumber: '',
    authorizationConfirmed: false,
  })

  const [step, setStep] = useState(1)
  const [editableName, setEditableName] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.message)

        const dbUser = json.data.user
        if (dbUser.onboardingCompleted) {
          navigate('/dashboard')
          return
        }

        let userPhone = dbUser.phone || authUser?.phone || ''
        let userPhoneCode = '+91'
        if (userPhone.startsWith('+')) {
          const match = userPhone.match(/^(\+\d{1,4})\s?(.*)$/)
          if (match) {
            userPhoneCode = match[1]
            userPhone = match[2]
          }
        }

        if (!cancelled) {
          setProfile({
            name: dbUser.name || '',
            email: dbUser.email || authUser?.email || '',
            phoneCode: userPhoneCode,
            phone: userPhone,
            designation: dbUser.designation || '',
            roleInCompany: dbUser.roleInCompany || '',
            companyName: dbUser.companyName || '',
            companyWebsite: dbUser.companyWebsite || '',
            industry: dbUser.industry || '',
            companySize: dbUser.companySize || '',
            country: dbUser.country || '',
            state: dbUser.state || '',
            city: dbUser.city || '',
            gstNumber: dbUser.gstNumber || '',
            authorizationConfirmed: false,
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
  }, [token, authUser?.email, navigate])

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }))
    if (error) setError('')
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleNextStep1 = () => {
    const errs = {}
    if (!profile.name.trim()) errs.name = 'Name is required'
    if (!profile.designation.trim()) errs.designation = 'Designation is required'
    if (!profile.roleInCompany.trim()) errs.roleInCompany = 'Role in company is required'
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setStep(2)
  }

  const handleNextStep2 = () => {
    const errs = {}
    if (!profile.companyName.trim()) errs.companyName = 'Company Name is required'
    if (!profile.industry.trim()) errs.industry = 'Industry is required'
    if (!profile.country.trim()) errs.country = 'Country is required'
    if (!profile.state.trim()) errs.state = 'State is required'
    if (!profile.city.trim()) errs.city = 'City is required'
    if (!profile.gstNumber.trim()) errs.gstNumber = 'GST Number is required'

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setStep(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile.authorizationConfirmed) {
      setError('You must confirm authorization to proceed.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/employer/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          designation: profile.designation.trim(),
          roleInCompany: profile.roleInCompany.trim(),
          companyName: profile.companyName.trim(),
          companyWebsite: profile.companyWebsite.trim() || undefined,
          industry: profile.industry.trim(),
          companySize: profile.companySize.trim() || undefined,
          country: profile.country.trim(),
          state: profile.state.trim(),
          city: profile.city.trim(),
          gstNumber: profile.gstNumber.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(getErrorMessage(json))

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Onboarding failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProfile && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f9fafb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-['Inter'] flex flex-col">
      <header className="w-full bg-white flex items-center justify-between px-8 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo-nobg.png" alt="Hireabl Logo" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-[poppins] font-medium text-blue-700 tracking-tight cursor-default">hireabl</span>
        </div>
        <div className="text-sm font-medium text-[#4b5563]">
          Already registered?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="text-[#2563eb] font-semibold hover:underline"
          >
            Login here
          </button>
        </div>
      </header>

      <main className="flex justify-center w-full max-w-[1050px] mx-auto px-6 pb-16">
        <div className="flex flex-col md:flex-row w-full bg-white rounded-[24px] shadow-sm overflow-hidden min-h-[600px] border border-[#f1f1f1]">
          
          <section className="flex-1 w-full p-8 md:p-12 lg:p-14 flex flex-col justify-center">
            
            <div className="mb-10 text-center">
              <h1 className="text-[32px] font-bold text-[#111827] mb-3">Welcome, Employer!</h1>
              <p className="text-[14px] text-[#6b7280]">
                Set up your company profile and start hiring great talent on <span className="font-semibold text-black">Hireabl</span>. 
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold ${step >= s ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-12 h-1 mx-2 rounded-full ${step > s ? 'bg-black' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

            <form className="space-y-4">
              
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Name */}
                  <div>
                    <div className="relative">
                      <input
                        className={`w-full rounded-full border px-6 py-3.5 pr-10 text-[14px] outline-none transition-colors duration-200 placeholder:text-[#9ca3af] ${
                          editableName
                            ? 'border-[#d1d5db] bg-white text-[#111827] focus:border-black'
                            : 'border-[#d1d5db] bg-[#f9fafb] text-[#6b7280]'
                        } ${fieldErrors.name ? '!border-[#ef4444]' : ''}`}
                        value={profile.name}
                        onChange={handleChange('name')}
                        placeholder="Full Name"
                        disabled={!editableName}
                      />
                      <button
                        type="button"
                        onClick={() => setEditableName(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-black"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    {fieldErrors.name && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.name}</p>}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      className="w-full rounded-full border border-[#d1d5db] bg-[#f9fafb] px-6 py-3.5 text-[14px] text-[#6b7280] outline-none cursor-not-allowed"
                      value={profile.email}
                      placeholder="Email Address"
                      disabled
                      readOnly
                    />
                    <div className="flex rounded-full border border-[#d1d5db] bg-[#f9fafb] overflow-hidden">
                      <div className="bg-transparent border-r border-[#d1d5db] py-3.5 pl-6 pr-3 text-[14px] text-[#6b7280] flex items-center">
                        {profile.phoneCode}
                      </div>
                      <input
                        className="w-full bg-transparent px-3 py-3.5 text-[14px] text-[#6b7280] outline-none cursor-not-allowed"
                        value={profile.phone}
                        placeholder="Phone Number"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Designation & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        className={`w-full rounded-full border bg-white px-6 py-3.5 text-[14px] placeholder:text-[#9ca3af] text-[#111827] outline-none focus:border-black transition-colors ${fieldErrors.designation ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                        value={profile.designation}
                        onChange={handleChange('designation')}
                        placeholder="Your Designation (e.g. CTO)"
                      />
                      {fieldErrors.designation && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.designation}</p>}
                    </div>

                    <div>
                      <select
                        className={`w-full rounded-full border bg-white px-6 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors cursor-pointer appearance-none ${fieldErrors.roleInCompany ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                        value={profile.roleInCompany}
                        onChange={handleChange('roleInCompany')}
                      >
                        <option value="" disabled>Role in Company</option>
                        <option value="HR">HR</option>
                        <option value="Manager">Manager</option>
                        <option value="Owner">Owner</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.roleInCompany && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.roleInCompany}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="w-full rounded-full bg-black px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#222222]"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div>
                    <input
                      className={`w-full rounded-full border bg-white px-6 py-3.5 text-[14px] placeholder:text-[#9ca3af] text-[#111827] outline-none focus:border-black transition-colors ${fieldErrors.companyName ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.companyName}
                      onChange={handleChange('companyName')}
                      placeholder="Company Name *"
                    />
                    {fieldErrors.companyName && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.companyName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      className="w-full rounded-full border border-[#d1d5db] bg-white px-6 py-3.5 text-[14px] placeholder:text-[#9ca3af] text-[#111827] outline-none focus:border-black transition-colors"
                      value={profile.companyWebsite}
                      onChange={handleChange('companyWebsite')}
                      placeholder="Company Website (Optional)"
                    />
                    <div>
                      <select
                        className={`w-full rounded-full border bg-white px-6 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.industry ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                        value={profile.industry}
                        onChange={handleChange('industry')}
                      >
                        <option value="" disabled>Industry *</option>
                        <option value="IT/Software">IT/Software</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.industry && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.industry}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      className="w-full rounded-full border border-[#d1d5db] bg-white px-6 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none"
                      value={profile.companySize}
                      onChange={handleChange('companySize')}
                    >
                      <option value="" disabled>Company Size (Optional)</option>
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-500">201-500 Employees</option>
                      <option value="500+">500+ Employees</option>
                    </select>

                    <div>
                      <input
                        className={`w-full rounded-full border bg-white px-6 py-3.5 text-[14px] placeholder:text-[#9ca3af] text-[#111827] outline-none focus:border-black transition-colors ${fieldErrors.gstNumber ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                        value={profile.gstNumber}
                        onChange={handleChange('gstNumber')}
                        placeholder="GST Number *"
                      />
                      {fieldErrors.gstNumber && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.gstNumber}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <select
                        className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.country ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                        value={profile.country}
                        onChange={(e) => {
                          setProfile(prev => ({ ...prev, country: e.target.value, state: '', city: '' }))
                          if (fieldErrors.country) setFieldErrors(prev => ({ ...prev, country: '' }))
                        }}
                      >
                        <option value="" disabled>Country *</option>
                        {Country.getAllCountries().map(country => (
                          <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                        ))}
                      </select>
                      {fieldErrors.country && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.country}</p>}
                    </div>

                    <div>
                      {profile.country && State.getStatesOfCountry(profile.country)?.length > 0 ? (
                        <select
                          className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.state ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                          value={profile.state}
                          onChange={(e) => {
                            setProfile(prev => ({ ...prev, state: e.target.value, city: '' }))
                            if (fieldErrors.state) setFieldErrors(prev => ({ ...prev, state: '' }))
                          }}
                        >
                          <option value="" disabled>State *</option>
                          {State.getStatesOfCountry(profile.country).map((st) => (
                            <option key={st.isoCode} value={st.isoCode}>{st.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] placeholder:text-[#111827] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.state ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                          value={profile.state}
                          onChange={handleChange('state')}
                          placeholder="State *"
                        />
                      )}
                      {fieldErrors.state && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.state}</p>}
                    </div>

                    <div>
                      {profile.country && profile.state && State.getStatesOfCountry(profile.country)?.length > 0 ? (
                        <select
                          className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                          value={profile.city}
                          onChange={handleChange('city')}
                        >
                          <option value="" disabled>City *</option>
                          {City.getCitiesOfState(profile.country, profile.state).map((city, i) => (
                            <option key={`${city.name}-${i}`} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                      ) : profile.country && (!profile.state || State.getStatesOfCountry(profile.country)?.length === 0) ? (
                        <select
                          className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                          value={profile.city}
                          onChange={handleChange('city')}
                        >
                          <option value="" disabled>City *</option>
                          {City.getCitiesOfCountry(profile.country).map((city, i) => (
                            <option key={`${city.name}-${i}`} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] placeholder:text-[#111827] text-[#111827] outline-none focus:border-black transition-colors appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                          value={profile.city}
                          onChange={handleChange('city')}
                          placeholder="City *"
                        />
                      )}
                      {fieldErrors.city && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.city}</p>}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 rounded-full bg-gray-100 px-6 py-3.5 text-[15px] font-semibold text-black transition hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="w-2/3 rounded-full bg-black px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#222222]"
                    >
                      Preview & Submit
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb] space-y-4">
                    <h3 className="font-semibold text-[16px] text-gray-900 border-b pb-2">Review Your Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-[13px]">
                      <div>
                        <p className="text-gray-500 font-medium">Name</p>
                        <p className="font-semibold text-gray-900">{profile.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Role</p>
                        <p className="font-semibold text-gray-900">{profile.designation} ({profile.roleInCompany})</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Company</p>
                        <p className="font-semibold text-gray-900">{profile.companyName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Industry</p>
                        <p className="font-semibold text-gray-900">{profile.industry}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Location</p>
                        <p className="font-semibold text-gray-900">{profile.city}, {profile.state}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">GST No.</p>
                        <p className="font-semibold text-gray-900">{profile.gstNumber}</p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-black"
                      checked={profile.authorizationConfirmed}
                      onChange={(e) => {
                        setProfile(prev => ({...prev, authorizationConfirmed: e.target.checked}))
                        if (error) setError('')
                      }}
                    />
                    <span className="text-[13.5px] leading-[1.4] text-gray-700 font-medium select-none">
                      As an employer, I confirm that I am authorized to verify employees and post jobs, ensuring the platform maintains trust.
                    </span>
                  </label>

                  {error && <p className="text-sm text-[#b42318] text-center">{error}</p>}

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 rounded-full bg-gray-100 px-6 py-4 text-[15px] font-semibold text-black transition hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !profile.authorizationConfirmed}
                      className="w-2/3 rounded-full bg-black px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#222222] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          Submitting...
                        </span>
                      ) : 'Complete Onboarding'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </section>
          
          <aside className="hidden lg:flex flex-col items-center justify-center w-[48%] bg-[#f5fbf7] p-12">
            <img 
              src="/onboarding_meditation.png" 
              alt="Illustration" 
              className="w-full max-w-[380px] h-auto object-contain mix-blend-multiply mb-12" 
            />
            <h2 className="text-[24px] leading-[1.3] font-medium text-[#111827] text-center w-full max-w-[340px]">
              Build your employer profile and discover top talent effortlessly on <span className="font-extrabold">Hireabl</span>
            </h2>
          </aside>

        </div>
      </main>
    </div>
  )
}

export default EmployerOnboardingPage
