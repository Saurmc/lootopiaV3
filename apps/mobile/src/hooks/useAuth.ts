import { useAuthStore } from '../store/auth.store';

/**
 * Hook auth — expose le store Zustand complet.
 * Usage: const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => useAuthStore();
