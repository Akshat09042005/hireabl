import { Request, Response, NextFunction } from 'express'
import { createEmployee } from '../services/employee.service'
import { sendSuccess, sendError } from '../utils/response'

/**
 * Controller to handle employee creation.
 */
export async function createEmployeeController(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, userId } = req.body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, 400, 'Name is required and must be a string')
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return sendError(res, 400, 'userId is required (User ID must be provided)')
    }

    const employee = await createEmployee(name.trim(), userId.trim())

    return sendSuccess(res, 201, 'Employee created successfully', { employee })
  } catch (err: any) {
    // Check for Prisma unique constraint violation (P2002)
    if (err.code === 'P2002') {
      return sendError(res, 409, 'User already has an associated employee record')
    }
    
    // Check for foreign key constraint violation (P2003) - userId not found
    if (err.code === 'P2003') {
      return sendError(res, 404, 'User not found with the provided userId')
    }

    next(err)
  }
}
