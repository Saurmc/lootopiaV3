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
            ? 'bg-gray-900 text-white font-semibold'
            : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        FR
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2 py-0.5 rounded transition-colors ${
          current === 'en'
            ? 'bg-gray-900 text-white font-semibold'
            : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}
