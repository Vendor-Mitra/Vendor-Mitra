import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [translations, setTranslations] = useState({})

  const languages = {
    en: 'English',
    hi: 'हिंदी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    bn: 'বাংলা'
  }

  useEffect(() => {
    // Load translations based on current language
    import(`../i18n/${currentLanguage}.js`)
      .then(module => setTranslations(module.default))
      .catch(() => setTranslations({}))
  }, [currentLanguage])

  const t = (key) => {
    return translations[key] || key
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
    localStorage.setItem('vendorMitraLanguage', lang)
  }

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vendorMitraLanguage')
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const value = {
    currentLanguage,
    languages,
    t,
    changeLanguage
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
} 