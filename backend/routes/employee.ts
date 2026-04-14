/**
 * routes/employee.ts
 * -------------------
 * Router for employee-related endpoints.
 *
 * Mounted at: /api/v1/employee (in server.ts)
 * Full paths:
 *   POST /api/v1/employee/create  → Create a new employee
 */

import express from 'express'
import {
  createEmployeeController,
  updateEmployeeProfileController,
} from '../controllers/employee.controller'

const router = express.Router()

// CREATE Employee
router.post('/create', createEmployeeController)
router.post('/profile', updateEmployeeProfileController)

export default router
