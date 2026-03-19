import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./features/auth";
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

import { GuestAccessViewpage, PortfolioDetailPage } from "./features/guest-access";

import { DashboardPage, HistoryPage } from "./features/dashbard";
import { ProjectsPage } from "./features/projects";

import "./App.css";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

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
          <Route
            path="/designer-profile"
            element={
              <ProtectedRoute>
                <DesignerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designer-profile/:userId"
            element={
              <ProtectedRoute>
                <DesignerProfilePage />
              </ProtectedRoute>
            }
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
          <Route
            path="/portfolio/:portfolioId"
            element={<PortfolioDetailPage />}
          />

          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Projects Route */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          {/* Fee Estimator Routes */}
          <Route
            path="/fee-estimator"
            element={
              <ProtectedRoute>
                <FeeEstimatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fee-estimator/base-rate"
            element={
              <ProtectedRoute>
                <BREstimationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fee-estimator/portfolio-based"
            element={
              <ProtectedRoute>
                <PBEstimationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fee-estimator/project-base"
            element={
              <ProtectedRoute>
                <PJEstimationPage />
              </ProtectedRoute>
            }
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div style={{ padding: "2rem" }}>Settings - Coming Soon</div>
              </ProtectedRoute>
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
