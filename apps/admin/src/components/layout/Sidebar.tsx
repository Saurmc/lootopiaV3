import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Mail } from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();

  const links = [
    { to: '/dashboard',   label: t('nav.dashboard'),   icon: LayoutDashboard },
    { to: '/partners',    label: t('nav.partners'),     icon: Users },
    { to: '/invitations', label: t('nav.invitations'),  icon: Mail },
  ];

  return (
    <aside
      className="w-60 text-white flex flex-col flex-shrink-0"
      style={{ background: 'linear-gradient(180deg, #242156 0%, #4B49B8 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
          L
        </div>
        <span className="text-base font-bold text-white tracking-tight">Lootopia</span>
        <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-md ml-auto tracking-wide">
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-2">
          {t('nav.section')}
        </p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
