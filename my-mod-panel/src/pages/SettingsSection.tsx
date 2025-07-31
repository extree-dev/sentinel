import { useState, useEffect } from 'react';
import './css/SettingSection.css';
import '../index.css'
import { FiSettings, FiMoon, FiSun } from 'react-icons/fi';

export default function SettingsSection() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Проверяем предпочтения пользователя или сохраненную тему
    return localStorage.getItem('darkMode') === 'true' ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ru';
  });
  const [apiKey, setApiKey] = useState('');

  // Применяем тему ко всему сайту
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Сохраняем выбранный язык
  useEffect(() => {
    localStorage.setItem('language', language);
    // Здесь можно добавить логику смены языка на всем сайте
  }, [language]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'id', name: 'Bahasa Indonesia (Indonesian)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'jv', name: 'Basa Jawa (Javanese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'tr', name: 'Türkçe (Turkish)' },
    { code: 'it', name: 'Italiano (Italian)' },
  ];

  return (
    <div className="settings">
      <div className="settings__content">
        {/* Темная тема */}
        <div className="settings__card">
          <div className="settings__card-content">
            <div className="settings__text">
              <h2 className="settings__header">
                {darkMode ? <FiMoon className="settings__icon" /> : <FiSun className="settings__icon" />}
                {darkMode ? 'Темная тема' : 'Светлая тема'}
              </h2>
              <p className="settings__description">
                {darkMode ? 'Используется темный режим' : 'Используется светлый режим'}
              </p>
            </div>
            <label className="settings__toggle">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="settings__toggle-input"
              />
              <span className="settings__toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Уведомления */}
        <div className="settings__card">
          <div className="settings__card-content">
            <div className="settings__text">
              <h2 className="settings__header">Уведомления</h2>
              <p className="settings__description">Получать уведомления о новых сообщениях</p>
            </div>
            <label className="settings__toggle">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                className="settings__toggle-input"
              />
              <span className="settings__toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Язык */}
        <div className="settings__card">
          <h2 className="settings__header">Язык интерфейса</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="settings__input settings__select"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* API ключ */}
        <div className="settings__card">
          <h2 className="settings__header">API ключ</h2>
          <p className="settings__description">Для интеграции с внешними сервисами</p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Введите ваш API ключ"
            className="settings__input"
          />
        </div>

        {/* Кнопки действий */}
        <div className="settings__actions">
          <button className="settings__button settings__button--primary">
            Сохранить настройки
          </button>
          <button className="settings__button settings__button--secondary">
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}