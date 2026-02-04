import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Homepage from './pages/Client/Homepage/Homepage'
import CompetitionsPage from './pages/Client/Competitions/Competitions'
import CompetitionEntry from './pages/Client/CompetitionEntry/CompetitionEntry'
import Checkout from './pages/Client/Checkout/Checkout'
import PaymentSuccess from './pages/Client/PaymentSuccess/PaymentSuccess'
import SignIn from './pages/Client/signin/SignIn'
import SignUp from './pages/Client/signup/SignUp'
import AuthCallback from './pages/Client/AuthCallback/AuthCallback'
import Account from './pages/Client/Account/Account'
import HowItWorks from './pages/Client/HowItWorks/HowItWorks'
import FAQ from './pages/Client/FAQ/FAQ'
import PrivacyPolicy from './pages/Client/Legal/PrivacyPolicy'
import Terms from './pages/Client/Legal/Terms'
import Partners from './pages/Client/Partners/Partners'
import PartnerProfile from './pages/Client/PartnerProfile/PartnerProfile'
import WinnersGallery from './pages/Client/Winners/Winners'
import Dashboard from './pages/Admin/Dashboard/Dashboard'
import Influencers from './pages/Admin/Influencers'
import Settings from './pages/Admin/Settings/Settings'
import Analytics from './pages/Admin/Analytics'
import Competitions from './pages/Admin/Competitions'
import CompetitionForm from './pages/Admin/Competitions/CompetitionForm'
import CompetitionDetail from './pages/Admin/Competitions/CompetitionDetail'
import Prizes from './pages/Admin/Prizes/Prizes'
import Users, { UserDetail } from './pages/Admin/Users'
import PromoCodes from './pages/Admin/PromoCodes'
import Winners, { WinnerDetail } from './pages/Admin/Winners'
import Fulfillments from './pages/Admin/Fulfillments'
import Withdrawals from './pages/Admin/Withdrawals'
import InfluencerSales from './pages/Admin/InfluencerSales'
import Activity from './pages/Admin/Activity'
import EmailLogs from './pages/Admin/EmailLogs'
import { DashboardLayout } from './pages/Admin/components'
import { AdminRoute, CartDrawer } from './components/common'
import ScrollToTop from './components/common/ScrollToTop'
import { ReferralTracker } from './components/ReferralTracker'
import { CookieConsent } from './components/CookieConsent'
import InfluencerDashboard from './pages/Influencer/Dashboard'
import ProfileEdit from './pages/Influencer/ProfileEdit'

function App() {
  // Check authentication status on mount
  useAuth()

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ReferralTracker />
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
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/partner/:slug" element={<PartnerProfile />} />
        <Route path="/winners" element={<WinnersGallery />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
        <Route path="/influencer/profile/edit" element={<ProfileEdit />} />
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
          <Route path="winners/:id" element={<WinnerDetail />} />
          <Route path="influencers" element={<Influencers />} />
          <Route path="influencer-sales" element={<InfluencerSales />} />
          <Route path="fulfillments" element={<Fulfillments />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="activity" element={<Activity />} />
          <Route path="email-logs" element={<EmailLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <CartDrawer />
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App