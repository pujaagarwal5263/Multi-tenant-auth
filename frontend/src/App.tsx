import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthMethodsPage from './pages/AuthMethodsPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import AuthErrorPage from './pages/AuthErrorPage';
import DashboardPage from './pages/DashboardPage';
import PasswordLoginPage from './pages/PasswordLoginPage';
import OtpLoginPage from './pages/OtpLoginPage';
import SsoConfigPage from './pages/SsoConfigPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth-methods" element={<AuthMethodsPage />} />
        <Route path="/login/password" element={<PasswordLoginPage />} />
        <Route path="/login/otp" element={<OtpLoginPage />} />
        <Route path="/auth/success" element={<AuthSuccessPage />} />
        <Route path="/auth/error" element={<AuthErrorPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/sso/:orgId" element={<SsoConfigPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
