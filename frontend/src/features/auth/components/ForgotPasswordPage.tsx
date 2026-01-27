import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/signin" className="back-button">
            ← Back to Sign In
          </Link>
          <div className="logo">
            <img 
              src="/AUREA - Logo.png" 
              alt="AUREA Logo" 
              width="48" 
              height="48"
            />
          </div>
        </div>

        <div className="auth-content">
          <h1>Reset Password</h1>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {success ? (
            <div className="success-message">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }}>
                <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2"/>
                <path d="M14 24L20 30L34 16" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Check your email!</h3>
              <p>
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>
              <Link to="/signin" className="submit-button" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="johnweek@aurea.tools"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Sending...' : 'SEND RESET LINK'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// exported as ForgotPasswordPage;
