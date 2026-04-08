export function normalizePhone(phone: string): string {
  return String(phone || '').replace(/[\s-]/g, '')
}

export function isValidPhoneIndia(phone: string): boolean {
  return /^\+91\d{10}$/.test(phone)
}

export function isValidOtp6(otp: string): boolean {
  return /^\d{6}$/.test(String(otp || '').trim())
}