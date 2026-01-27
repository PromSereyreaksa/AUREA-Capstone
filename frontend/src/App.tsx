import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth';
import {
  SignUpPage,
  SignInPage,
  VerifyEmailPage,
  ForgotPasswordPage,
} from './features/auth';
import './App.css';

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
          
          {/* Placeholder Routes */}
          <Route path="/dashboard" element={<div style={{ padding: '2rem' }}>Dashboard - Coming Soon</div>} />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/signup" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
