import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Homepage from './pages/Homepage/Homepage'
import SignIn from './pages/signin/SignIn'
import AuthCallback from './pages/AuthCallback/AuthCallback'
import Dashboard from './pages/Dashboard/Dashboard/Dashboard'
import Settings from './pages/Dashboard/Settings/Settings'
import Competitions from './pages/Dashboard/Competitions'
import CompetitionForm from './pages/Dashboard/CompetitionForm'
import CompetitionDetail from './pages/Dashboard/CompetitionDetail'
import { DashboardLayout } from './pages/Dashboard/components'
import { AdminRoute } from './components/common'

function App() {
  // Check authentication status on mount
  useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="competitions/new" element={<CompetitionForm />} />
          <Route path="competitions/:id" element={<CompetitionDetail />} />
          <Route path="competitions/:id/edit" element={<CompetitionForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App