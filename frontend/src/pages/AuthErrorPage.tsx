import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const message = searchParams.get('message') || 'Authentication failed';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Failed
        </h1>
        <p className="text-gray-500 mb-6">
          {message}
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
