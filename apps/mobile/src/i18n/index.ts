import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

const detectLanguage = (): string => {
  try {
    // expo-localization is included in Expo SDK 55
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization') as {
      getLocales: () => Array<{ languageCode: string | null }>;
    };
    const code = getLocales()[0]?.languageCode ?? 'fr';
    return code.startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
};

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
