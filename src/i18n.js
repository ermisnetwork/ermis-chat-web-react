import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import { LocalStorageKey } from './constants/localStorage-const';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

const savedLang = localStorage.getItem(LocalStorageKey.Locale) || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
