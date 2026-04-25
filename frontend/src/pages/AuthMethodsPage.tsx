import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface LocationState {
  email: string;
  authMethods: string[];
}

export default function AuthMethodsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  useEffect(() => {
    if (!state?.email || !state?.authMethods) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) return null;

  const { email, authMethods } = state;

  const handlePasswordLogin = () => {
    navigate('/login/password', { state: { email } });
  };

  const handleOtpLogin = () => {
    navigate('/login/otp', { state: { email } });
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/api/auth/google?email=${encodeURIComponent(email)}`;
  };

  const handleSsoLogin = () => {
    // Redirect to backend SSO endpoint
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/api/auth/sso?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Choose Login Method
        </h1>
        <p className="text-gray-500 text-center mb-2">
          Logging in as
        </p>
        <p className="text-blue-600 font-medium text-center mb-8">
          {email}
        </p>

        <div className="space-y-4">
          {authMethods.includes('PASSWORD') && (
            <button
              onClick={handlePasswordLogin}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Login with Password
            </button>
          )}

          {authMethods.includes('OTP') && (
            <button
              onClick={handleOtpLogin}
              className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Login with Email OTP
            </button>
          )}

          {authMethods.includes('GOOGLE') && (
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {authMethods.includes('SSO') && (
            <button
              onClick={handleSsoLogin}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Login with SSO
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Use a different email
        </button>
      </div>
    </div>
  );
}
