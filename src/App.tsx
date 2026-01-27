import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Homepage from './pages/Homepage/Homepage'
import CompetitionsPage from './pages/Competitions/Competitions'
import CompetitionEntry from './pages/CompetitionEntry/CompetitionEntry'
import Checkout from './pages/Checkout/Checkout'
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess'
import SignIn from './pages/signin/SignIn'
import SignUp from './pages/signup/SignUp'
import AuthCallback from './pages/AuthCallback/AuthCallback'
import Account from './pages/Account/Account'
import Dashboard from './pages/Dashboard/Dashboard/Dashboard'
import Settings from './pages/Dashboard/Settings/Settings'
import Analytics from './pages/Dashboard/Analytics'
import Competitions from './pages/Dashboard/Competitions'
import CompetitionForm from './pages/Dashboard/CompetitionForm'
import CompetitionDetail from './pages/Dashboard/CompetitionDetail'
import Prizes from './pages/Dashboard/Prizes/Prizes'
import Users, { UserDetail } from './pages/Dashboard/Users'
import PromoCodes from './pages/Dashboard/PromoCodes'
import Winners from './pages/Dashboard/Winners'
import Fulfillments from './pages/Dashboard/Fulfillments'
import Withdrawals from './pages/Dashboard/Withdrawals'
import { DashboardLayout } from './pages/Dashboard/components'
import { AdminRoute, CartDrawer } from './components/common'

function App() {
  // Check authentication status on mount
  useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:slug" element={<CompetitionEntry />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/account" element={<Account />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="competitions/new" element={<CompetitionForm />} />
          <Route path="competitions/:id" element={<CompetitionDetail />} />
          <Route path="competitions/:id/edit" element={<CompetitionForm />} />
          <Route path="prizes" element={<Prizes />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="promo-codes" element={<PromoCodes />} />
          <Route path="winners" element={<Winners />} />
          <Route path="fulfillments" element={<Fulfillments />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <CartDrawer />
    </BrowserRouter>
  )
}

export default App