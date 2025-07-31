import { Routes, Route, Link, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';

import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import TermsOfService from './pages/TermsOfService';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import AuthRoute from './components/AuthRoute';
import ModerationSection from './components/ModerationSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import DiscordUsersPage from './pages/DiscordUsersPage';
import SettingsSection from './pages/SettingsSection';
import UserVerification from './pages/UserVerification';
import VerificationRequest from './pages/VerificationRequests'
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div data-theme={theme}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Шапка */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><Link to="/" className="hover:text-indigo-200">Главная</Link></li>
                <li><Link to="/dashboard" className="hover:text-indigo-200">Панель</Link></li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Основной контент */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/callback" element={<Callback />} />
            <Route
              path="/dashboard"
              element={
                <AuthRoute>
                  <Dashboard />
                </AuthRoute>
              }
            >
              <Route index element={<ModerationSection />} />
              <Route path="moderation" element={<ModerationSection />} />
              <Route path="analytics" element={<AnalyticsSection />} />
              <Route path="users" element={<DiscordUsersPage />} />
              <Route path="settings" element={<SettingsSection />} />
              <Route path="*" element={<Navigate to="moderation" replace />} />
              <Route path="verification-requests" element={<VerificationRequest />} />
            </Route>

            <Route
              path="/verification"
              element={
                <AuthRoute isVerificationPage>
                  <UserVerification />
                </AuthRoute>
              }
            />

          </Routes>
        </main>

        {/* Подвал */}
        <footer className="footer">
          <div className="container">
            <p>© {new Date().getFullYear()} Sentinel Mod Panel. Все права защищены.</p>
            <div className="footer-policy">
              <Link to="/privacy" className="policy-privacy">Политика конфиденциальности</Link>
              <Link to="/cookies" className="policy-cookie">Политика Cookie</Link>
              <Link to="/terms" className="policy-termsuse">Условия использования</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;