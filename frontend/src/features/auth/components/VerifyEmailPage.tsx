import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { verifyEmail, resendOtp } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmail(verificationCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card verify-card">
        <div className="auth-header">
          <Link to="/signup" className="back-button">
            ← Back
          </Link>
          <div className="logo">
            <img src="/AUREA - Logo.png" alt="AUREA Logo" />
          </div>
        </div>

        <div className="auth-content verify-content">
          <div className="verify-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" fill="#FFF5F0" stroke="#FF6B35" strokeWidth="2"/>
              <path d="M20 32L28 40L44 24" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1>Verify your email</h1>
          <p className="verify-subtitle">
            We've sent a verification code to your email address. Please enter it below.
          </p>

          <form onSubmit={handleSubmit} className="verify-form">
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="code-input"
                />
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Verifying...' : 'VERIFY EMAIL'}
            </button>

            <p className="resend-text">
              Didn't receive the code?{' '}
              <button 
                type="button" 
                className="resend-button"
                onClick={async () => {
                  setResendLoading(true);
                  setResendSuccess(false);
                  setError('');
                  try {
                    await resendOtp();
                    setResendSuccess(true);
                  } catch (err: any) {
                    setError(err.message || 'Failed to resend code');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend'}
              </button>
            </p>
            {resendSuccess && <p className="success-message">OTP resent successfully!</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

// exported as VerifyEmailPage;
