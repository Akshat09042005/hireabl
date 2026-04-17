/**
 * routes/employee.ts
 * -------------------
 * Router for employee-related endpoints.
 *
 * Mounted at: /api/v1/employee (in server.ts)
 * Full paths:
 *   POST /api/v1/employee/create       → Create a new employee
 *   POST /api/v1/employee/profile      → Update basic profile (Step 1)
 *   POST /api/v1/employee/professional → Update professional details (Step 2)
 */

import express from 'express'
import {
  createEmployeeController,
  updateEmployeeProfileController,
  updateEmployeeProfessionalController,
  updateEmployeeEmployerController,
} from '../controllers/employee.controller'
import { verifyJWT } from '../middleware/verifyJWT'

const router = express.Router()

// CREATE Employee
router.post('/create', createEmployeeController)

// Step 1: Basic profile
router.post('/profile', verifyJWT, updateEmployeeProfileController)

// Step 2: Professional details
router.post('/professional', verifyJWT, updateEmployeeProfessionalController)

// Step 3: Employer details & Complete Onboarding
router.post('/employer-details', verifyJWT, updateEmployeeEmployerController)

export default router
