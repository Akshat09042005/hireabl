import 'dotenv/config'

import express, { Application } from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'

import { initPassport } from './services/passport.service'
import authRoutes from './routes/auth'
import employeeRoutes from './routes/employee'
import employerRoutes from './routes/employer'
import userRoutes from './routes/user'
import { verifyJWT } from './middleware/verifyJWT'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'

const PORT = process.env.PORT || 5051
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const app: Application = express()

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}))

app.use(passport.initialize())
app.use(passport.session())

initPassport(passport)

// ── Routes ───────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/user', verifyJWT, userRoutes)
app.use('/api/v1/employer', verifyJWT, employerRoutes)
app.use('/api/v1/employee', verifyJWT, employeeRoutes)

// ── Error handling ───────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`)
})