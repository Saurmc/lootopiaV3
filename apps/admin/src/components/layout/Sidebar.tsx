import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/partners', label: 'Partenaires' },
  { to: '/invitations', label: 'Invitations' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Navigation</p>
      </div>
      <nav className="flex-1 py-3">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white font-medium border-l-2 border-orange-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
