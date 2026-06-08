import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, BarChart2, Settings, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const MAIN_NAV = [
    { to: '/dashboard', label: 'Dashboard',          icon: LayoutDashboard },
    { to: '/hunts',     label: t('nav.hunts'),        icon: Map },
    { to: '/stats',     label: t('nav.stats'),        icon: BarChart2 },
  ];

  const SETTINGS_NAV = [
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside
      className="w-60 text-white flex flex-col shrink-0"
      style={{ background: 'linear-gradient(180deg, #242156 0%, #4B49B8 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
          L
        </div>
        <span className="text-base font-bold text-white tracking-tight">Lootopia</span>
        <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-md ml-auto tracking-wide">
          PARTENAIRE
        </span>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-2">
          {t('nav.sectionMain')}
        </p>
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        <div className="pt-5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-2">
            {t('nav.sectionSettings')}
          </p>
          {SETTINGS_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-white/65 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bouton créer une chasse */}
      <div className="px-3 pb-6">
        <button
          onClick={() => navigate('/hunts/new')}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('hunts.createBtn')}
        </button>
      </div>
    </aside>
  );
}
