import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { FaDiscord, FaTwitter, FaGithub } from 'react-icons/fa';
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
import './pages/css/Footer.css'
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div data-theme={theme}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Шапка */}

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
        <footer className="footer">
          <div className="footer-grid">
            {/* Бренд и описание */}
            <div className="footer-brand">
              <div className="footer-logo">Sentinel</div>
              <p className="footer-description">Модерация нового поколения для ваших Discord серверов</p>
            </div>
            <div className="footer-links-group">
              <h3 className="footer-links-title">Продукт</h3>
              <Link to="/features" className="footer-link">Функции</Link>
              <Link to="/integrations" className="footer-link">Интеграции</Link>
              <Link to="/roadmap" className="footer-link">Дорожная карта</Link>
            </div>
            <div className="footer-links-group">
              <h3 className="footer-links-title">Документация</h3>
              <Link
                to="/privacy"
                className="footer-link"
                data-text="Конфиденциальность"
              >
                Конфиденциальность
              </Link>
              <Link
                to="/cookies"
                className="footer-link"
                data-text="Cookie"
              >
                Cookie
              </Link>
              <Link
                to="/terms"
                className="footer-link"
                data-text="Условия"
              >
                Условия
              </Link>
            </div>
            <div className="footer-socials">
              <div className="social-links">
                <a href="#" className="social-link"><FaDiscord /></a>
                <a href="#" className="social-link"><FaTwitter /></a>
                <a href="#" className="social-link"><FaGithub /></a>
              </div>
              <div className="footer-copyright">
                © {new Date().getFullYear()} Sentinel Mod Panel. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;