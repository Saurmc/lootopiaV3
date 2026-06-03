import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('fr') ? 'fr' : 'en';

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => i18n.changeLanguage('fr')}
        className={`px-2 py-0.5 rounded transition-colors ${
          current === 'fr'
            ? 'bg-white text-gray-900 font-semibold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        FR
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2 py-0.5 rounded transition-colors ${
          current === 'en'
            ? 'bg-white text-gray-900 font-semibold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
