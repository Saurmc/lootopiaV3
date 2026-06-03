import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-6 flex-shrink-0">
      <span className="font-semibold text-sm">Lootopia Admin</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400">{user?.email}</span>
        <button
          onClick={logout}
          className="text-gray-300 hover:text-white transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
