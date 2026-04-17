import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil, X, Check, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

import { Country, State, City } from 'country-state-city'

function EmployeeOnboardingPage() {
  const navigate = useNavigate()
  const { token, user: authUser } = useAuth()




  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneCode: '+91',
    phone: '',
    country: '',
    state: '',
    city: '',
    profilePhoto: '',
  })

  
  // const COUNTRY_CITIES = {
  //   "India": ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata"],
  //   "United States": ["New York", "San Francisco", "Los Angeles", "Chicago", "Austin", "Seattle"],
  //   "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
  //   "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  //   "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  //   "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  //   "Singapore": ["Singapore"],
  //   "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  //   "Other": []
  // };

  // const PHONE_CODES = [
  //   { code: '+91', country: '🇮🇳 +91 (India)' },
  //   { code: '+1', country: '🇺🇸 +1 (US/CA)' },
  //   { code: '+44', country: '🇬🇧 +44 (UK)' },
  //   { code: '+61', country: '🇦🇺 +61 (AU)' },
  //   { code: '+49', country: '🇩🇪 +49 (DE)' },
  //   { code: '+65', country: '🇸🇬 +65 (SG)' },
  //   { code: '+971', country: '🇦🇪 +971 (UAE)' }
  // ];
  const [resumeFile, setResumeFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldRefs = useRef({})
  const [editableName, setEditableName] = useState(false)

  // Ensure these imports are before or after depending on how VITE works, handled.
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'

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
        let userPhone = dbUser.phone || '';
        let userPhoneCode = '+91';
        let userCountryIso = '';

        // Extract phone code if any Matches known codes
        if (userPhone.startsWith('+')) {
          const allCountries = Country.getAllCountries();
          const sortedCountries = [...allCountries].sort((a,b) => b.phonecode.length - a.phonecode.length);
          for (const c of sortedCountries) {
            if (userPhone.startsWith('+' + c.phonecode)) {
              userPhoneCode = '+' + c.phonecode;
              userPhone = userPhone.slice(c.phonecode.length + 1).trim();
              userCountryIso = c.isoCode;
              break;
            }
          }
        }
        
        if (!userCountryIso && dbUser.country) {
          const allCountries = Country.getAllCountries();
          const match = allCountries.find(c => c.name === dbUser.country || c.isoCode === dbUser.country);
          if (match) userCountryIso = match.isoCode;
        }
        if (!cancelled) {
          setProfile({
            name: dbUser.name || '',
            email: dbUser.email || authUser?.email || '',
            phoneCode: userPhoneCode,
            phone: userPhone,
            country: userCountryIso || '',
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
  }, [loadingProfile])

  useEffect(() => {
    if (editableName) fieldRefs.current.name?.focus()
  }, [editableName])

  const completion = useMemo(() => {
    const step1Fields = [
      String(profile.name || '').trim(),
      String(profile.phone || '').trim(),
      String(profile.country || '').trim(),
      String(profile.city || '').trim(),
      resumeFile,
    ]
    return Math.round((step1Fields.filter(Boolean).length / step1Fields.length) * 33)
  }, [profile.name, profile.phone, profile.country, profile.city, resumeFile])

  const isContinueDisabled = useMemo(
    () => (
      submitting ||
      loadingProfile ||
      !profile.name.trim() ||
      // !profile.phone.trim() ||
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

  const extractProfileDataFromText = (text) => {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    
    // Basic heuristic: First distinct short line is often the name
    const candidates = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 30 && !/\d/.test(l));
    const nameMatch = candidates.length > 0 ? candidates[0] : null;
    
    setProfile(prev => ({
      ...prev,
      email: prev.email || (emailMatch ? emailMatch[0] : prev.email),
      phone: prev.phone || (phoneMatch ? cleanPhoneForProfile(phoneMatch[0]) : prev.phone),
      name: prev.name || (nameMatch ? toTitleCase(nameMatch) : prev.name)
    }));
  }

  const validateAndSetResume = (file) => {
    if (!file) return
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ]
    if (!allowed.includes(file.type)) {
      setError('Please upload a valid resume file (PDF, DOC, DOCX, PNG, JPG)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Resume file must be under 2 MB')
      return
    }
    setResumeFile(file)
    if (error) setError('')
    
    // Auto-parse image-based resumes with Tesseract, and PDFs with pdfjs-dist
    if (file.type.startsWith('image/')) {
      parseResumeImage(file);
    } else if (file.type === 'application/pdf') {
       parseResumePDF(file);
    }
  }

  const parseResumeImage = async (file) => {
    try {
      setIsParsing(true)
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      extractProfileDataFromText(text);
    } catch (err) {
      console.error('Tesseract parsing failed:', err);
    } finally {
      setIsParsing(false)
    }
  }

  const parseResumePDF = async (file) => {
    try {
      setIsParsing(true)
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(buffer).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY = -1;
        const pageStrings = textContent.items.map(item => {
           const currentY = item.transform ? item.transform[5] : 0;
           let prefix = '';
           if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
               prefix = '\n';
           }
           lastY = currentY;
           return prefix + item.str;
        });
        fullText += pageStrings.join('') + '\n';
      }
      
      extractProfileDataFromText(fullText);
    } catch (err) {
      console.error('PDF parsing failed:', err);
    } finally {
      setIsParsing(false)
    }
  }

  // Helper to clean extracted phone numbers to 10 digits if possible
  const cleanPhoneForProfile = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
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
    const fullPhone = `${profile.phoneCode} ${profile.phone}`.trim()
    const payload = {
      name: toTitleCase(profile.name.trim()),
      email: profile.email.trim(),
      phone: fullPhone,
      country: profile.country.trim(),
      state: profile.state.trim(),
      city: profile.city.trim(),
    }

    const nextFieldErrors = {}
    if (!payload.name)    nextFieldErrors.name = 'Name is required'
    // if (!payload.phone)   nextFieldErrors.phone = 'Phone is required'
    if (!payload.country) nextFieldErrors.country = 'Country is required'
    if (!payload.state)   nextFieldErrors.state = 'State is required'
    if (!payload.city)    nextFieldErrors.city = 'City is required'
    if (!resumeFile)      nextFieldErrors.resume = 'Resume is required'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      const firstErrorField = ['name', 'phone', 'country', 'state', 'city', 'resume'].find((k) => nextFieldErrors[k])
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
    <div className="min-h-screen bg-[#f6f8fb] font-['Inter']">
      {/* Top Header Strip */}
      <header className="w-full bg-white flex items-center justify-between px-8 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo-nobg.png" alt="Hireabl Logo" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-[poppins] font-medium text-blue-700 tracking-tight cursor-default">hireabl</span>
        </div>
        <div className="text-sm font-medium text-[#4b5563]">
          Already registered?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/signup')} 
            className="text-[#2563eb] font-semibold hover:underline"
          >
            Login here
          </button>
        </div>
      </header>

      {/* Phone Confirmation Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
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

      {/* Page content */}
      <main className="flex justify-center w-full max-w-[1050px] mx-auto px-6 pb-16">
        <div className="flex flex-col md:flex-row w-full bg-white rounded-[24px] shadow-sm overflow-hidden min-h-[600px] border border-[#f1f1f1]">
          
          {/* Left Form Section */}
          <section className="flex-1 w-full p-8 md:p-12 lg:p-14 flex flex-col justify-center">
            
            <div className="mb-10 text-center">
              <h1 className="text-[32px] font-bold text-[#111827] mb-3">Welcome!</h1>
              <p className="text-[14px] text-[#6b7280]">
                Build your profile and let companies rate you on <span className="font-semibold text-black">Hireabl</span>. Get started for free.
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold ${s === 1 ? 'bg-black text-white' : s < 1 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s < 1 ? <Check size={16} /> : s}
                  </div>
                  {s < 4 && <div className={`w-6 sm:w-10 h-1 mx-2 rounded-full ${s < 1 ? 'bg-black' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Resume Upload */}
              <div>
                <div className="flex items-center gap-4">
                  <label
                    ref={setFieldRef('resume')}
                    className={`flex items-center justify-center px-6 py-3.5 bg-white border border-[#d1d5db] rounded-full text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-black ${fieldErrors.resume ? 'border-[#ef4444]' : ''} ${isParsing ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <span className="mr-2">{isParsing ? '⏳' : '📄'}</span> {isParsing ? 'Parsing...' : resumeFile ? 'Replace Resume' : 'Upload Resume'}
                    <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleResumeChange} disabled={isParsing} />
                  </label>
                  {resumeFile && (
                    <div className="text-sm font-medium text-black truncate max-w-[180px]">
                      {resumeFile.name}
                    </div>
                  )}
                </div>
                {fieldErrors.resume && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.resume}</p>}
                {!resumeFile && !fieldErrors.resume && <p className="mt-1.5 flex items-center text-[12px] text-[#9ca3af] px-3">PDF, DOCX, or Images up to 2MB (Images Auto-Parsed)</p>}
              </div>

              {/* Name */}
              <div>
                <div className="relative">
                  <input
                    ref={setFieldRef('name')}
                    className={`w-full rounded-full border px-6 py-3.5 pr-10 text-[14px] outline-none transition-colors duration-200 placeholder:text-[#9ca3af] ${
                      editableName
                        ? 'border-[#d1d5db] bg-white text-[#111827] focus:border-black'
                        : 'border-[#d1d5db] bg-[#f9fafb] text-[#6b7280]'
                    } ${fieldErrors.name ? '!border-[#ef4444]' : ''}`}
                    value={profile.name}
                    onChange={handleChange('name')}
                    onBlur={handleNameBlur}
                    placeholder="Full Name"
                    disabled={!editableName}
                  />
                  <button
                    type="button"
                    onClick={() => setEditableName(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-black"
                    aria-label="Edit name"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                {fieldErrors.name && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.name}</p>}
              </div>

              {/* Email — locked */}
              <div>
                <input
                  className="w-full rounded-full border border-[#d1d5db] bg-[#f9fafb] px-6 py-3.5 text-[14px] text-[#6b7280] placeholder:text-[#9ca3af] outline-none cursor-not-allowed"
                  value={profile.email}
                  placeholder="Email Address"
                  disabled
                  readOnly
                />
              </div>

              {/* Phone */}
              <div>
                <div className="relative flex rounded-full border border-[#d1d5db] bg-[#f9fafb] focus-within:border-black transition-colors overflow-hidden">
                  <div className="bg-transparent border-r border-[#d1d5db] py-3.5 pl-6 pr-3 text-[14px] text-[#6b7280] flex items-center shrink-0">
                    {profile.phoneCode}
                  </div>
                  <input
                    className="w-full bg-transparent px-3 py-3.5 pr-11 text-[14px] text-[#6b7280] placeholder:text-[#9ca3af] outline-none cursor-not-allowed"
                    value={profile.phone}
                    onChange={handleChange('phone')}
                    placeholder="Phone Number"
                    disabled
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-black"
                    aria-label="Change phone number"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>

              {/* Country + State + City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <select
                    ref={setFieldRef('country')}
                    className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors duration-200 cursor-pointer appearance-none ${fieldErrors.country ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                    value={profile.country}
                    onChange={(e) => {
                      setProfile(prev => ({ ...prev, country: e.target.value, state: '', city: '' }));
                      if (fieldErrors.country) setFieldErrors(prev => ({ ...prev, country: '' }));
                    }}
                  >
                    <option value="" disabled>Country</option>
                    {Country.getAllCountries().map(country => (
                      <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                    ))}
                  </select>
                  {fieldErrors.country && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.country}</p>}
                </div>

                <div>
                  {profile.country && State.getStatesOfCountry(profile.country)?.length > 0 ? (
                    <select
                      ref={setFieldRef('state')}
                      className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors duration-200 cursor-pointer appearance-none ${fieldErrors.state ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.state}
                      onChange={(e) => {
                        setProfile(prev => ({ ...prev, state: e.target.value, city: '' }));
                        if (fieldErrors.state) setFieldErrors(prev => ({ ...prev, state: '' }));
                      }}
                    >
                      <option value="" disabled>State</option>
                      {State.getStatesOfCountry(profile.country).map((st) => (
                        <option key={st.isoCode} value={st.isoCode}>{st.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={setFieldRef('state')}
                      className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] placeholder:text-[#111827] text-[#111827] outline-none focus:border-black transition-colors duration-200 appearance-none ${fieldErrors.state ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.state}
                      onChange={handleChange('state')}
                      placeholder="State"
                    />
                  )}
                  {fieldErrors.state && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.state}</p>}
                </div>

                <div>
                  {profile.country && profile.state && State.getStatesOfCountry(profile.country)?.length > 0 ? (
                    <select
                      ref={setFieldRef('city')}
                      className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors duration-200 cursor-pointer appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.city}
                      onChange={handleChange('city')}
                    >
                      <option value="" disabled>City</option>
                      {City.getCitiesOfState(profile.country, profile.state).map((city, i) => (
                        <option key={`${city.name}-${i}`} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  ) : profile.country && (!profile.state || State.getStatesOfCountry(profile.country)?.length === 0) ? (
                    <select
                      ref={setFieldRef('city')}
                      className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] text-[#111827] outline-none focus:border-black transition-colors duration-200 cursor-pointer appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.city}
                      onChange={handleChange('city')}
                    >
                      <option value="" disabled>City</option>
                      {City.getCitiesOfCountry(profile.country).map((city, i) => (
                        <option key={`${city.name}-${i}`} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={setFieldRef('city')}
                      className={`w-full rounded-full border bg-white px-5 py-3.5 text-[14px] placeholder:text-[#111827] text-[#111827] outline-none focus:border-black transition-colors duration-200 appearance-none ${fieldErrors.city ? 'border-[#ef4444]' : 'border-[#d1d5db]'}`}
                      value={profile.city}
                      onChange={handleChange('city')}
                      placeholder="City"
                    />
                  )}
                  {fieldErrors.city && <p className="mt-1 text-[13px] text-[#b42318] px-3">{fieldErrors.city}</p>}
                </div>
              </div>

              {error && <p className="text-sm text-[#b42318] text-center">{error}</p>}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isContinueDisabled || submitting}
                  className="w-full rounded-full bg-black px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </span>
                  ) : loadingProfile ? 'Loading...' : 'Save & Continue'}
                </button>
              </div>

            </form>
          </section>
          
          {/* Right Illustration Section */}
          <aside className="hidden lg:flex flex-col items-center justify-center w-[48%] bg-[#f5fbf7] p-12">
            <img 
              src="/onboarding_meditation.png" 
              alt="Illustration" 
              className="w-full max-w-[380px] h-auto object-contain mix-blend-multiply mb-12" 
            />
            <h2 className="text-[24px] leading-[1.3] font-medium text-[#111827] text-center w-full max-w-[340px]">
              Build your profile and let companies rate you on <span className="font-extrabold">Hireabl</span>
            </h2>
          </aside>

        </div>
      </main>
    </div>
  )
}

export default EmployeeOnboardingPage
