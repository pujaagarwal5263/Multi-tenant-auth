import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const accessToken = localStorage.getItem('accessToken');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Dashboard
        </h1>
        <p className="text-gray-500 text-center mb-6">
          You are logged in!
        </p>
        
        {accessToken && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Access Token (truncated):</p>
            <p className="text-sm font-mono text-gray-700 break-all">
              {accessToken.substring(0, 50)}...
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
