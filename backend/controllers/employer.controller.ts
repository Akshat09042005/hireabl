import { Request, Response, NextFunction } from 'express'
import { updateEmployerOnboarding } from '../services/employer.service'
import { AuthenticatedRequest } from '../middleware/verifyJWT'
import { sendSuccess, sendError } from '../utils/response'

export async function updateEmployerOnboardingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest
    const userId = authReq.user?.id

    if (!userId) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED')
    }

    const {
      designation,
      roleInCompany,
      companyName,
      companyWebsite,
      industry,
      companySize,
      country,
      state,
      city,
      gstNumber,
    } = req.body

    if (!designation) return sendError(res, 'Designation is required', 400, 'DESIGNATION_REQUIRED')
    if (!roleInCompany) return sendError(res, 'Role in company is required', 400, 'ROLE_IN_COMPANY_REQUIRED')
    if (!companyName) return sendError(res, 'Company name is required', 400, 'COMPANY_NAME_REQUIRED')
    if (!industry) return sendError(res, 'Industry is required', 400, 'INDUSTRY_REQUIRED')
    if (!country) return sendError(res, 'Country is required', 400, 'COUNTRY_REQUIRED')
    if (!state) return sendError(res, 'State is required', 400, 'STATE_REQUIRED')
    if (!city) return sendError(res, 'City is required', 400, 'CITY_REQUIRED')
    if (!gstNumber) return sendError(res, 'GST number is required', 400, 'GST_NUMBER_REQUIRED')

    const user = await updateEmployerOnboarding(userId, {
      designation,
      roleInCompany,
      companyName,
      companyWebsite,
      industry,
      companySize,
      country,
      state,
      city,
      gstNumber,
    })

    return sendSuccess(res, 200, 'Employer details updated successfully', { user })
  } catch (err) {
    next(err)
  }
}
