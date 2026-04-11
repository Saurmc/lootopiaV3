import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <span className="text-sm text-gray-500 capitalize">
        {user?.role?.toLowerCase() ?? ''}
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:underline"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
