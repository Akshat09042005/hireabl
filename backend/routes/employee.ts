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
import { createEmployeeController } from '../controllers/employee.controller'
import { verifyJWT } from '../middleware/verifyJWT'

const router = express.Router()

// CREATE Employee
router.post('/create', verifyJWT, createEmployeeController)

export default router
