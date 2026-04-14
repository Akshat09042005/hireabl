import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SignupProvider } from './context/SignupContext'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import SignupEntryPage from './pages/SignupEntryPage'
import VerifyOtpPage from './pages/VerifyOtpPage'

function App() {
  return (
    <SignupProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignupEntryPage />} />
        <Route path="/signup/social" element={<Navigate to="/signup" replace />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <ToastContainer />
    </SignupProvider>
  )
}

export default App
