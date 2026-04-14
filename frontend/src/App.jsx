import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SignupProvider } from './context/SignupContext'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import SignupEntryPage from './pages/SignupEntryPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import AuthSuccessPage from './pages/AuthSuccessPage'
import LoginPage from './pages/LoginPage'
import EmployerOnboardingPage from './pages/EmployerOnboardingPage'
import EmployeeOnboardingPage from './pages/EmployeeOnboardingPage'

function App() {
  return (
    <SignupProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignupEntryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/social" element={<Navigate to="/signup" replace />} />
        <Route path="/auth-success" element={<AuthSuccessPage />} />
        <Route path="/employee/onboarding" element={<EmployeeOnboardingPage />} />
        <Route path="/employer/onboarding" element={<EmployerOnboardingPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <ToastContainer />
    </SignupProvider>
  )
}

export default App
