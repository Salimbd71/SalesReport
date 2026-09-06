import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Theme, translations, Translations } from '../i18n/translations';

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: Translations;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or system preference (defaults to dark)
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return 'dark'; // default theme is sleek dark as requested
    } catch {
      return 'dark';
    }
  });

  // Initialize language from localStorage (defaults to English or Bengali)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('app_language');
      if (savedLang === 'en' || savedLang === 'bn') {
        return savedLang;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  // Sync theme to document root element and body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('app_theme', theme);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }, [theme]);

  // Sync language to localStorage and document lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('app_language', language);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }, [language]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        toggleLanguage,
        setLanguage,
        setTheme,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = (): ThemeLanguageContextType => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
