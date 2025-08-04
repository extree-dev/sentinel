import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
import LanguageSwitcher from './components/LanguageSwitcher';
import './pages/css/Footer.css'
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' }
  ];

  useEffect(() => {
    const yearElement = document.querySelector('.year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear().toString();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (dropdownId: string) => {
    const toggle = document.getElementById(dropdownId);
    if (toggle) {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', (!isExpanded).toString());

      const list = document.getElementById(toggle.getAttribute('aria-controls') || '');
      if (list) {
        list.style.display = isExpanded ? 'none' : 'block';
      }
    }
  };


  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    setIsLanguageOpen(false);
    // Здесь можно добавить логику смены языка приложения
  };


  return (
    <div data-theme={theme}>
      <div className='main'>
        {/* Шапка */}

        {/* Основной контент */}
        <main>
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
        <div className="footer_n">
          <div className="discord-2022--footer_new">
            <div className="discord-2022--footer-styles w-embed"></div>
            <div className="discord-2022--container-1762">
              <div className="w-layout-grid discord-2022--grid-footer discord-2022--is-new-com">
                <div id="w-node-_80288ee3-50aa-e520-a1b5-f05c93fd7d18-93fd7d14" className="discord-2022--vertical-flex discord-2022--mobile-left discord-2022--is_new">
                  <a href="/" className="discord-2022--footer-logo-link w-inline-block">
                    <img src="src/img/Discord-Symbol-White.png" loading="lazy" alt="Sentinel Home" />
                    <div className='discord-2022--footer-logo-link w-inline-block p'>
                      <p>Sentinel Mod Panel</p>
                    </div>
                  </a>
                  <div className="discord-2022--p-footer">Language</div>
                  <div className="discord-2022--padding-16px"></div>
                  <LanguageSwitcher />
                  {/* Соцсети для десктопа */}
                  <div className="discord-2022--desctop-soc">
                    <div className="discord-2022--p-footer discord-2022--hide-landscape">Social</div>
                    <div className="discord-2022--flex-horizontal discord-2022--top-soc-new">
                      <a data-track="discord" href="https://discord.gg/your-invite" target="_blank" className="discord-2022--link-s w-inline-block">
                        <img src="src/img/Discord-Symbol-White.png" loading="lazy" alt="Discord" className="discord-2022--image" />
                      </a>
                      <a data-track="twitter" href="https://twitter.com/your-twitter" target="_blank" className="discord-2022--link-s w-inline-block">
                        <img src="src/img/github-mark-white.png" loading="lazy" alt="Twitter" className="discord-2022--image" />
                      </a>
                    </div>
                  </div>
                </div>
                <div id="w-node-_80288ee3-50aa-e520-a1b5-f05c93fd7d90-93fd7d14">
                  <div className="discord-2022--footer-h-link discord-2022--show-landscape">Menu</div>
                  <div data-hover="false" data-delay="0" className="discord-2022--dropdown-footer w-dropdown">
                    <div className="discord-2022--dropdown-toggle-footer w-dropdown-toggle" id="w-dropdown-toggle-12" aria-controls="w-dropdown-list-12" aria-haspopup="menu" aria-expanded="false" role="button" tabIndex={0}>
                      <div>Product</div>
                      <img src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119f90b32c4c283f6915_0de9af0fe90fba53b80f020909344da6_Chevron%20Down.svg" loading="lazy" alt="" className="discord-2022--arrow-drop discord-2022--show-landscape" />
                    </div>
                    <nav className="discord-2022--dropdown-list-footer w-dropdown-list" id="w-dropdown-list-12" aria-labelledby="w-dropdown-toggle-12">
                      <div className="discord-2022--padding-16px discord-2022--show-landscape"></div>
                      <a data-track="features" href="/features" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Functions</a>
                      <a data-track="integrations" href="/integrations" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Integrations</a>
                      <a data-track="roadmap" href="/roadmap" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Road Map</a>
                    </nav>
                  </div>
                </div>
                <div id="w-node-_80288ee3-50aa-e520-a1b5-f05c93fd7da2-93fd7d14">
                  <div data-hover="false" data-delay="0" className="discord-2022--dropdown-footer w-dropdown">
                    <div className="discord-2022--dropdown-toggle-footer w-dropdown-toggle" id="w-dropdown-toggle-13" aria-controls="w-dropdown-list-13" aria-haspopup="menu" aria-expanded="false" role="button" tabIndex={0}>
                      <div>Documentation</div>
                      <img src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119f90b32c4c283f6915_0de9af0fe90fba53b80f020909344da6_Chevron%20Down.svg" loading="lazy" alt="" className="discord-2022--arrow-drop discord-2022--show-landscape" />
                    </div>
                    <nav className="discord-2022--dropdown-list-footer w-dropdown-list" id="w-dropdown-list-13" aria-labelledby="w-dropdown-toggle-13">
                      <div className="discord-2022--padding-16px discord-2022--show-landscape"></div>
                      <a data-track="privacy" href="/privacy" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Confidentiality</a>
                      <a data-track="cookies" href="/cookies" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Cookie</a>
                      <a data-track="terms" href="/terms" className="discord-2022--link-footer discord-2022--top-new-link" tabIndex={0}>Terms</a>
                    </nav>
                  </div>
                </div>
                <div id="w-node-_80288ee3-50aa-e520-a1b5-f05c93fd7de6-93fd7d14" className="discord-2022--show-soc">
                  <div className="discord-2022--p-footer">Social</div>
                  <div className="discord-2022--flex-horizontal discord-2022--top-soc-new">
                    <a data-track="discord" href="https://discord.gg/your-invite" target="_blank" className="discord-2022--link-s w-inline-block">
                      <img src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119e90b32c4c283f6891_91ce5945e0716b8f27aba591ed3ce824_x.svg" loading="lazy" alt="Discord" className="discord-2022--image" />
                    </a>
                    <a data-track="twitter" href="https://twitter.com/your-twitter" target="_blank" className="discord-2022--link-s w-inline-block">
                      <img src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119e90b32c4c283f6891_91ce5945e0716b8f27aba591ed3ce824_x.svg" loading="lazy" alt="Twitter" className="discord-2022--image" />
                    </a>
                    <a data-track="github" href="https://github.com/your-github" target="_blank" className="discord-2022--link-s w-inline-block">
                      <img src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119e90b32c4c283f6891_91ce5945e0716b8f27aba591ed3ce824_x.svg" loading="lazy" alt="GitHub" className="discord-2022--image" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="discord-2022--container_word">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div className="footer-copyright" style={{ color: "var(--discord-2022---greyple)", fontSize: "14px", padding: "3rem" }}>
                  © <span className="year">2023</span> Sentinel Mod Panel. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div >

  );
}

export default App;