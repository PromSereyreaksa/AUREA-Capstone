import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Get token and email from URL params
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // Validate that we have the required params
    if (!token || !email) {
      setTokenError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const validatePassword = (): boolean => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Show error if token/email is missing
  if (tokenError) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <img src="/AUREA - Logo.png" alt="AUREA Logo" />
            </div>
          </div>

          <div className="auth-content">
            <div className="error-state">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }}>
                <circle cx="24" cy="24" r="22" fill="#FFEBEE" stroke="#F44336" strokeWidth="2"/>
                <path d="M16 16L32 32M32 16L16 32" stroke="#F44336" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>Invalid Reset Link</h3>
              <p>{tokenError}</p>
              <Link to="/forgot-password" className="submit-button" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/signin" className="back-button">
            ← Back to Sign In
          </Link>
          <div className="logo">
            <img src="/AUREA - Logo.png" alt="AUREA Logo" />
          </div>
        </div>

        <div className="auth-content">
          <h1>Set New Password</h1>
          <p className="auth-subtitle">
            Enter your new password for <strong>{email}</strong>
          </p>

          {success ? (
            <div className="success-message">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }}>
                <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2"/>
                <path d="M14 24L20 30L34 16" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Password Reset Successful!</h3>
              <p>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button 
                onClick={() => navigate('/signin')} 
                className="submit-button" 
                style={{ marginTop: '1rem' }}
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Resetting...' : 'RESET PASSWORD'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
