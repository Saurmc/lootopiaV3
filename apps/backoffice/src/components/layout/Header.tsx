import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import LanguageSwitcher from '../LanguageSwitcher';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/hunts':     'nav.hunts',
  '/stats':     'nav.stats',
  '/settings':  'nav.settings',
};

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  const rawTitle = Object.entries(ROUTE_TITLES).find(([path]) =>
    location.pathname.startsWith(path),
  )?.[1] ?? 'Dashboard';
  const pageTitle = rawTitle.includes('.') ? t(rawTitle) : rawTitle;

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
      <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        {/* Bell */}
        <button className="relative w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-100">
          <Bell className="h-4 w-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #242156, #4B49B8)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">
                {user?.email ?? 'Partenaire'}
              </p>
              <p className="text-[10px] text-gray-400">Partenaire</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {open && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-700 truncate">{user?.email}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
