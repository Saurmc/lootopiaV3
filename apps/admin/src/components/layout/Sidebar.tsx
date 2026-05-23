import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/invitations', label: 'Invitations partenaires' },
  { to: '/users', label: 'Utilisateurs' },
  { to: '/hunts', label: 'Chasses' },
  { to: '/badges', label: 'Badges' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-800 text-gray-100 flex flex-col flex-shrink-0">
      <nav className="flex-1 py-4">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
