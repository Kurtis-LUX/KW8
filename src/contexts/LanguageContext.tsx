import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTranslation } from '../utils/translations';

type Language = 'it' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof useTranslation>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize language from localStorage or default to 'it'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('kw8-language') as Language;
    return savedLanguage || 'it';
  });
  const t = useTranslation(language);

  const handleLanguageChange = (lang: Language) => {
    // Save language to localStorage first
    localStorage.setItem('kw8-language', lang);
    setLanguage(lang);
    // Refresh the page after language change
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
      {children}
    </LanguageContext.Provider>
  );
};