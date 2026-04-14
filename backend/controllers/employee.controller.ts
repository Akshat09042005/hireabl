import { Request, Response, NextFunction } from 'express'
import { createEmployee, updateEmployeeProfile } from '../services/employee.service'
import { AuthenticatedRequest } from '../middleware/verifyJWT'
import { sendSuccess, sendError } from '../utils/response'

/**
 * Controller to handle employee creation.
 */
export async function createEmployeeController(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, userId } = req.body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, 'Name is required and must be a string', 400, 'INVALID_NAME')
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return sendError(res, 'userId is required (User ID must be provided)', 400, 'INVALID_USER_ID')
    }

    const employee = await createEmployee(name.trim(), userId.trim())

    return sendSuccess(res, 201, 'Employee created successfully', { employee })
  } catch (err: any) {
    // Check for Prisma unique constraint violation (P2002)
    if (err.code === 'P2002') {
      return sendError(res, 'User already has an associated employee record', 409, 'EMPLOYEE_EXISTS')
    }
    
    // Check for foreign key constraint violation (P2003) - userId not found
    if (err.code === 'P2003') {
      return sendError(res, 'User not found with the provided userId', 404, 'USER_NOT_FOUND')
    }

    next(err)
  }
}

/**
 * Controller to handle basic employee onboarding profile update (step 1).
 */
export async function updateEmployeeProfileController(
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

    const country = String(req.body?.country || '').trim()
    const qualification = String(req.body?.qualification || '').trim()
    const companyName = String(req.body?.companyName || '').trim()
    const city = String(req.body?.city || '').trim()

    if (!country) {
      return sendError(res, 'Country is required', 400, 'COUNTRY_REQUIRED')
    }

    if (!qualification) {
      return sendError(res, 'Qualification is required', 400, 'QUALIFICATION_REQUIRED')
    }

    const user = await updateEmployeeProfile(
      userId,
      country,
      qualification,
      companyName || undefined,
      city || undefined,
    )

    return sendSuccess(res, 200, 'Employee profile updated successfully', { user })
  } catch (err) {
    next(err)
  }
}
