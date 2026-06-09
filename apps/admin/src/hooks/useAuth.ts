import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const { token: newToken, refreshToken: newRefreshToken, user: newUser } = await authService.login(email, password);
    setAuth(newToken, newRefreshToken, newUser);
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
