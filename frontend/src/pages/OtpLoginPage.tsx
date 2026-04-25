import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface LocationState {
  email: string;
}

export default function OtpLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!state?.email) {
      navigate('/');
    }
  }, [state, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (!state?.email) return null;

  const { email } = state;

  const sendOtp = async () => {
    setError('');
    setSendingOtp(true);

    try {
      const response = await api.post('/auth/send-otp', { email });

      if (response.data.success) {
        setOtpSent(true);
        setResendTimer(60); // 60 second cooldown
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-send OTP on mount
  useEffect(() => {
    if (!otpSent && state?.email) {
      sendOtp();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Enter OTP
        </h1>
        <p className="text-gray-500 text-center mb-2">
          {otpSent ? 'We sent a code to' : 'Sending code to'}
        </p>
        <p className="text-blue-600 font-medium text-center mb-8">
          {email}
        </p>

        {!otpSent ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Sending OTP...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                6-digit code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={sendOtp}
              disabled={sendingOtp || resendTimer > 0}
              className="w-full text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
            >
              {resendTimer > 0 
                ? `Resend OTP in ${resendTimer}s` 
                : sendingOtp 
                  ? 'Sending...' 
                  : 'Resend OTP'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-6 text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to login methods
        </button>
      </div>
    </div>
  );
}
