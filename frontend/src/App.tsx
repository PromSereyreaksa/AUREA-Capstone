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
  ResetPasswordPage,
  AuthCallbackPage,
} from "./features/auth";
import { DesignerProfilePage } from "./features/profile";

import {
  Header,
  Hero,
  PricingFeature,
  CalloutBanner,
  ProductExplanation,
  Footer,
} from "./features/landing-page";
import {
  FeeEstimatorPage,
  BREstimationPage,
  PBEstimationPage,
  PJEstimationPage,
} from "./features/fee-estimator";

import { GuestAccessViewpage } from "./features/guest-access";

import { DashboardPage } from "./features/dashbard";
import { ProjectsPage } from "./features/projects";

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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Designer profile routes */}
          <Route path="/designer-profile" element={<DesignerProfilePage />} />
          <Route
            path="/designer-profile/:userId"
            element={<DesignerProfilePage />}
          />

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

          {/* Projects Route */}
          <Route path="/projects" element={<ProjectsPage />} />

          {/* Fee Estimator Routes */}
          <Route path="/fee-estimator" element={<FeeEstimatorPage />} />
          <Route
            path="/fee-estimator/base-rate"
            element={<BREstimationPage />}
          />
          <Route
            path="/fee-estimator/portfolio-based"
            element={<PBEstimationPage />}
          />
          <Route
            path="/fee-estimator/project-base"
            element={<PJEstimationPage />}
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <div style={{ padding: "2rem" }}>Settings - Coming Soon</div>
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
