import twilio from 'twilio'

export async function sendOtp(phone: string) {
  const client = twilio(
    process.env.TWILIO_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )

  const verification = await client.verify.v2
    .services(process.env.TWILIO_SERVICE_SID!)
    .verifications.create({
      to: phone,
      channel: 'sms',
    })

  return { status: verification.status }
}

export async function verifyOtp(phone: string, code: string) {
  const client = twilio(
    process.env.TWILIO_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )

  const check = await client.verify.v2
    .services(process.env.TWILIO_SERVICE_SID!)
    .verificationChecks.create({
      to: phone,
      code,
    })

  return {
    approved: check.status === 'approved',
    status: check.status,
  }
}