import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-6 flex-shrink-0">
      <span className="font-semibold text-sm">{t('header.title')}</span>
      <div className="flex items-center gap-5 text-sm">
        <LanguageSwitcher />
        <span className="text-gray-400">{user?.email}</span>
        <button
          onClick={logout}
          className="text-gray-300 hover:text-white transition-colors"
        >
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
}
