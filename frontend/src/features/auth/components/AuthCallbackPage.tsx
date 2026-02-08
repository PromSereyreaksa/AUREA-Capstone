import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const authService = new AuthService();
        const user = await authService.handleGoogleCallback();
        
        if (user) {
          // Successfully authenticated, redirect to dashboard or home
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to authenticate with Google');
          setTimeout(() => navigate('/signin', { replace: true }), 3000);
        }
      } catch (err: any) {
        console.error('Google callback error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/signin', { replace: true }), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing sign in with Google...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <p className="mt-2 text-gray-500">Redirecting to sign in page...</p>
        </div>
      </div>
    );
  }

  return null;
};
