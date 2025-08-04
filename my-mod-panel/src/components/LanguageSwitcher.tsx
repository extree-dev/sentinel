import { useState, useEffect, useRef } from 'react';

interface Language {
    code: string;
    name: string;
}

export default function LanguageSwitcher() {
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
        <div className="discord-2022--dropdown-language-wr w-dropdown">
            <div
                className="discord-2022--dropdown-language-btn w-dropdown-toggle"
                id="w-dropdown-toggle-11"
                aria-controls="w-dropdown-list-11"
                aria-haspopup="menu"
                aria-expanded={isLanguageOpen}
                role="button"
                tabIndex={0}
                onClick={() => {
                    setIsLanguageOpen(!isLanguageOpen);
                    toggleDropdown('w-dropdown-toggle-11');
                }}
            >
                <div className="discord-2022--dropdown-language-name">{currentLanguage}</div>
                <img
                    src="https://cdn.prod.website-files.com/5f8dd67f8fdd6f51f0b50904/66fd119f90b32c4c283f68fd_13b796631a0178df3105d55d1d629706_Chevron%20Down.svg"
                    loading="lazy"
                    alt=""
                    className="discord-2022--dropdown-language-arrow"
                />
            </div>
            <nav
                className="discord-2022--dropdown-language-list-wr w-dropdown-list"
                id="w-dropdown-list-11"
                aria-labelledby="w-dropdown-toggle-11"
                style={{ display: isLanguageOpen ? 'block' : 'none' }}
            >
                <ul role="list" className="discord-2022--dropdown-list-container-wr">
                    {languages.map((lang) => (
                        <li
                            key={lang.code}
                            tabIndex={0}
                            data-locale={lang.code}
                            className="discord-2022--dropdown-list-container"
                            onClick={() => handleLanguageChange(lang.name)}
                        >
                            <div className="discord-2022--dropdown-language-item">{lang.name}</div>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}