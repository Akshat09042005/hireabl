import { Request, Response, NextFunction } from 'express'
import { createEmployee, updateEmployeeProfile, updateEmployeeProfessional } from '../services/employee.service'
import { AuthenticatedRequest } from '../middleware/verifyJWT'
import { sendSuccess, sendError } from '../utils/response'

/**
 * Controller to handle employee creation.
 */
export async function createEmployeeController(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, userId } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, 'Name is required and must be a string', 400, 'INVALID_NAME')
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return sendError(res, 'userId is required', 400, 'INVALID_USER_ID')
    }

    const employee = await createEmployee(name.trim(), userId.trim())
    return sendSuccess(res, 201, 'Employee created successfully', { employee })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return sendError(res, 'User already has an associated employee record', 409, 'EMPLOYEE_EXISTS')
    }
    if (err.code === 'P2003') {
      return sendError(res, 'User not found with the provided userId', 404, 'USER_NOT_FOUND')
    }
    next(err)
  }
}

/**
 * Controller to handle basic employee onboarding profile update (Step 1).
 * POST /api/v1/employee/profile
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
    const state = String(req.body?.state || '').trim()
    const city = String(req.body?.city || '').trim()

    if (!country) return sendError(res, 'Country is required', 400, 'COUNTRY_REQUIRED')
    if (!state)   return sendError(res, 'State is required', 400, 'STATE_REQUIRED')
    if (!city)    return sendError(res, 'City is required', 400, 'CITY_REQUIRED')

    const user = await updateEmployeeProfile(userId, country, state, city)
    return sendSuccess(res, 200, 'Employee profile updated successfully', { user })
  } catch (err) {
    next(err)
  }
}

/**
 * Controller to handle professional details update (Step 2).
 * POST /api/v1/employee/professional
 */
export async function updateEmployeeProfessionalController(
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

    const qualification = String(req.body?.qualification || '').trim()
    const companyName   = String(req.body?.companyName || '').trim()
    const designation   = String(req.body?.designation || '').trim()
    const skills        = Array.isArray(req.body?.skills) ? req.body.skills as string[] : []
    const yearsOfExperience =
      req.body?.yearsOfExperience !== undefined && req.body.yearsOfExperience !== ''
        ? Number(req.body.yearsOfExperience)
        : undefined
    const workEmail = String(req.body?.workEmail || '').trim() || undefined

    if (!qualification) return sendError(res, 'Qualification is required', 400, 'QUALIFICATION_REQUIRED')
    if (!companyName)   return sendError(res, 'Company name is required', 400, 'COMPANY_REQUIRED')
    if (!designation)   return sendError(res, 'Designation is required', 400, 'DESIGNATION_REQUIRED')
    if (skills.length === 0) return sendError(res, 'At least one skill is required', 400, 'SKILLS_REQUIRED')

    const user = await updateEmployeeProfessional(userId, {
      qualification,
      companyName,
      designation,
      skills,
      yearsOfExperience,
      workEmail,
    })

    return sendSuccess(res, 200, 'Professional details updated successfully', { user })
  } catch (err) {
    next(err)
  }
}

/**
 * Step 3: Employer details & Verification Emails
 * POST /api/v1/employee/employer-details
 */
export async function updateEmployeeEmployerController(
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
      employerName,
      hrEmail,
      managerEmail,
      ceoEmail,
    } = req.body

    const { prisma } = await import('../utils/prisma')
    const { sendManagerVerificationEmail } = await import('../services/email.service')

    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!dbUser) {
      return sendError(res, 'User record not found', 404, 'USER_NOT_FOUND')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        companyName: employerName || dbUser.companyName,
        hrEmail: hrEmail || undefined,
        managerEmail: managerEmail || undefined,
        ceoEmail: ceoEmail || undefined,
        onboardingCompleted: true,
      },
      include: { employee: true, employer: true }
    })

    const employeeName = updatedUser.name || 'An employee'

    if (hrEmail) {
      sendManagerVerificationEmail(hrEmail, employeeName, 'HR / Manager').catch(console.error)
    }
    if (managerEmail && managerEmail !== hrEmail) {
      sendManagerVerificationEmail(managerEmail, employeeName, 'Manager').catch(console.error)
    }

    return sendSuccess(res, 200, 'Employer details saved and emails dispatched', { user: updatedUser })
  } catch (err) {
    next(err)
  }
}
