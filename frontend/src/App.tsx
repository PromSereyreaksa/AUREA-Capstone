import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./features/auth";
import {
  SignUpPage,
  SignInPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  AuthCallbackPage,
} from './features/auth';
import { 
  DesignerProfilePage
} from './features/profile';

import {
  Header,
  Hero,
  PricingFeature,
  CalloutBanner,
  ProductExplanation,
  Footer,
} from "./features/landing-page";

import { GuestAccessViewpage } from "./features/guest-access";

import { DashboardPage } from "./features/dashbard";

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Feature Routes */}
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Designer profile route */}
          <Route path="/designer-profile/:designerId" element={<DesignerProfilePage />} />
          
          {/* Landing Page Routes */}
          <Route
            path="/"
            element={
              <>
                <Header />
                <Hero />
                <PricingFeature />
                <CalloutBanner />
                <ProductExplanation />
                <Footer />
              </>
            }
          />

          {/* Guest Access / Portfolios Route */}
          <Route path="/portfolios" element={<GuestAccessViewpage />} />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Placeholder Routes */}
          <Route
            path="/projects"
            element={
              <div style={{ padding: "2rem" }}>Projects - Coming Soon</div>
            }
          />
          <Route
            path="/fee-estimator"
            element={
              <div style={{ padding: "2rem" }}>Fee Estimator - Coming Soon</div>
            }
          />
          <Route
            path="/settings"
            element={
              <div style={{ padding: "2rem" }}>Settings - Coming Soon</div>
            }
          />
          <Route
            path="/profile"
            element={
              <div style={{ padding: "2rem" }}>Profile - Coming Soon</div>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/signup" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
