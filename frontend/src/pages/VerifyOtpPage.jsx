import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Phone, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/apiError'

const OTP_LENGTH = 6
const PHONE_REGEX = /^\+91\d{10}$/
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051'
const RESEND_COOLDOWN_SECONDS = 120

/** Digits only → +91 + last 10 digits */
function toIndiaE164(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  let rest = d.startsWith('91') ? d.slice(2) : d
  rest = rest.slice(0, 10)
  return rest.length === 10 ? `+91${rest}` : ''
}

function VerifyOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const { token } = useAuth()

  const [phone, setPhone] = useState('+91')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef([])

  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const intervalRef = useRef(null)

  const [phoneError, setPhoneError] = useState('')
  const [otpError, setOtpError] = useState('')

  const mapOtpErrorMessage = (message, mode) => {
    if (!message) {
      return mode === 'send'
        ? 'Unable to send OTP. Check your number or try again'
        : 'Unable to process request. Please try again'
    }

    if (message.includes('Failed to send OTP')) {
      return 'Unable to send OTP. Check your number or try again'
    }
    if (message.includes('Too many')) {
      return 'Too many attempts. Please wait'
    }
    if (message.includes('Please enter a valid phone number')) {
      return 'Please enter a valid phone number'
    }
    if (message.includes('Phone number already in use')) {
      return 'Phone number already in use'
    }

    return message
  }

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startResendTimer = () => {
    clearTimer()
    setSecondsRemaining(RESEND_COOLDOWN_SECONDS)
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (searchParams.get('social') === 'success') {
      startResendTimer()
      const timer = setTimeout(() => {
        toast.success('Social signup successful! Please verify your phone number.')
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('social')
        navigate({ search: newParams.toString() }, { replace: true })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchParams, navigate])

  useEffect(() => {
    return () => clearTimer()
  }, [])

  const handleSendOtp = async () => {
    const normalized = toIndiaE164(phone)
    if (!normalized) {
      setPhoneError('Enter a valid 10-digit mobile number')
      return
    }
    setPhone(normalized)

    try {
      setSendingOtp(true)
      setPhoneError('')

      const res = await fetch(`${BACKEND_URL}/api/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      })
      if (!res.ok) {
        const msg = await getErrorMessage(res, 'Unable to send OTP')
        throw new Error(msg)
      }

      setOtpSent(true)
      setOtp(Array(OTP_LENGTH).fill(''))
      setOtpError('')
      startResendTimer()
    } catch (err) {
      if (err instanceof TypeError) {
        setPhoneError('Network error. Please check your connection')
      } else {
        const msg = err instanceof Error ? err.message : ''
        setPhoneError(mapOtpErrorMessage(msg, 'send'))
      }
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('')
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError(`Please enter all ${OTP_LENGTH} digits`)
      return
    }

    try {
      setVerifying(true)
      setOtpError('')

      const res = await fetch(`${BACKEND_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone, otp: otpValue }),
      })
      if (!res.ok) {
        const msg = await getErrorMessage(res, 'Unable to process request. Please try again')
        throw new Error(msg)
      }

      toast.success('Verified successfully!')
      console.log('Next Path:', nextPath)
      navigate(nextPath)
    } catch (err) {
      if (err instanceof TypeError) {
        setOtpError('Network error. Please check your connection')
      } else {
        const msg = err instanceof Error ? err.message : ''
        setOtpError(mapOtpErrorMessage(msg, 'verify'))
      }
    } finally {
      setVerifying(false)
    }
  }

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    const after91 = digits.startsWith('91') ? digits.slice(2) : digits
    setPhone(`+91${after91.slice(0, 10)}`)
    setPhoneError('')
  }

  const handleOtpBoxChange = (value, index) => {
    const d = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = d
    setOtp(newOtp)

    if (d && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1].focus()
    }
    setOtpError('')
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  return (
    <main className="min-h-screen relative bg-[url('/signupbackground.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center font-['Inter'] p-[20px]">
      <div className="absolute inset-0 bg-transparent flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center w-full max-w-[420px] z-10 p-[20px]">
          <img 
            src="/logo.jpg" 
            className="w-[140px] h-[170px] object-cover object-top mb-[24px] rounded-[8px]" 
            style={{ mixBlendMode: 'multiply' }}
            alt="Logo" 
          />
          
          <section className="w-full bg-white rounded-[16px] p-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] text-center animate-signup-fade-in">
            <h1 className="text-[24px] font-bold text-[#111827] mb-[8px] mt-0 tracking-[-0.02em]">Verify your phone</h1>
            <p className="text-[15px] font-normal text-[#6b7280] mb-[32px]">
              We will send a one-time code to confirm your number.
            </p>

            {!otpSent ? (
              <div className="mt-[28px]">
                <div className="w-full mb-[20px] text-left">
                  <div className="relative w-full">
                    <Phone className="absolute left-[14px] top-[52%] -translate-y-1/2 text-[#9ca3af] pointer-events-none" size={20} />
                    <input
                      className="w-full h-[52px] pt-[12px] pr-[14px] pb-[12px] pl-[42px] border border-[#e5e7eb] rounded-[12px] text-[16px] text-[#111827] bg-[#f9fafb] transition-all duration-200 ease-in-out focus:outline-none focus:border-[#2563eb] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                      type="tel"
                      placeholder="+91 Mobile number"
                      value={phone}
                      onChange={handlePhoneChange}
                      disabled={sendingOtp}
                    />
                  </div>
                  {phoneError && <p className="mt-[8px] text-[0.875rem] text-[#b42318]">{phoneError}</p>}
                </div>

                <button
                  className="w-full h-[52px] bg-[#2563eb] text-white border-none rounded-[12px] text-[16px] font-semibold cursor-pointer mt-[8px] shadow-[0_4px_6px_-1px_rgba(37,99,235,0.1),0_2px_4px_-1px_rgba(37,99,235,0.06)] hover:bg-[#1d4ed8] hover:shadow-[0_10px_15px_-3px_rgba(37,99,235,0.2)] active:scale-95 disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="mt-[28px]">
                <div className="mb-[24px] text-[14px] text-[#6b7280] flex justify-center items-center gap-[8px]">
                  <p className="m-0">Code sent to <strong>{phone}</strong></p>
                  <button className="bg-none border-none text-[#2563eb] font-semibold underline cursor-pointer text-[14px]" onClick={() => setOtpSent(false)}>Edit</button>
                </div>

                <div className="w-full mb-[20px] text-left">
                  <div className="flex items-center gap-[8px] mb-[12px] text-[#374151] font-semibold text-[14px]">
                    <KeyRound className="text-[#9ca3af]" size={18} />
                    <span>Enter OTP</span>
                  </div>
                  <div className="flex justify-center gap-[8px] my-[24px]">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => inputRefs.current[idx] = el}
                        className="w-[46px] h-[56px] border-2 border-[#e5e7eb] rounded-[10px] text-[22px] font-bold text-center text-[#111827] bg-white transition-all duration-200 ease-in-out focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] disabled:bg-[#f3f4f6] disabled:opacity-70"
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(e.target.value, idx)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        disabled={verifying}
                      />
                    ))}
                  </div>
                  {otpError && <p className="mt-[8px] text-[0.875rem] text-[#b42318]">{otpError}</p>}
                </div>

                <button
                  className="w-full h-[52px] bg-[#2563eb] text-white border-none rounded-[12px] text-[16px] font-semibold cursor-pointer mt-[8px] shadow-[0_4px_6px_-1px_rgba(37,99,235,0.1),0_2px_4px_-1px_rgba(37,99,235,0.06)] hover:bg-[#1d4ed8] hover:shadow-[0_10px_15px_-3px_rgba(37,99,235,0.2)] active:scale-95 disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otp.some(d => !d)}
                >
                  {verifying ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button 
                  className="block w-full mt-[24px] bg-none border-none text-[#6b7280] font-medium underline cursor-pointer text-[14px] hover:text-[#111827] disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handleSendOtp}
                  disabled={sendingOtp || verifying || secondsRemaining > 0}
                >
                  {secondsRemaining > 0
                    ? `Resend OTP in ${secondsRemaining}s`
                    : 'Resend OTP'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default VerifyOtpPage