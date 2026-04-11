import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authService, type LoginPayload } from '../services/auth.service';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (payload: LoginPayload) => {
    const { token: newToken, user: newUser } = await authService.login(payload);
    setAuth(newToken, newUser);
    navigate('/dashboard');
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return {
    token,
    user,
    isAuthenticated: token !== null,
    login,
    logout,
  };
}
