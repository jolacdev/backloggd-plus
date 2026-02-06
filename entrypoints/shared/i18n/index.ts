import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enContent from './locales/en/content.json';
import enPopup from './locales/en/popup.json';
import esContent from './locales/es/content.json';
import esPopup from './locales/es/popup.json';

const FALLBACK_LANGUAGE = 'en';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_LANGUAGE;
  }

  const navigatorLanguage = window.navigator.language.split('-')[0];
  return navigatorLanguage || FALLBACK_LANGUAGE;
};

i18n.use(initReactI18next).init({
  // defaultNS: 'common', // A `common` namespace could be defined if needed.
  fallbackLng: FALLBACK_LANGUAGE,
  lng: getInitialLanguage(),
  interpolation: {
    // React already safes from XSS, so i18next escaping is disabled to avoid escaping twice.
    escapeValue: false,
  },
  resources: {
    en: {
      content: enContent,
      popup: enPopup,
    },
    es: {
      content: esContent,
      popup: esPopup,
    },
  },
});

export default i18n;
