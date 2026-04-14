import rateLimit from 'express-rate-limit'

const TOO_MANY_REQUESTS_MESSAGE = 'Too many attempts. Please try after some time'

function createLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: TOO_MANY_REQUESTS_MESSAGE,
    },
  })
}

export const otpLimiter = createLimiter(10 * 60 * 1000, 5)
export const verifyOtpLimiter = createLimiter(10 * 60 * 1000, 10)
export const oauthLimiter = createLimiter(15 * 60 * 1000, 20)
