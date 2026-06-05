import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { useAuthStore } from '../store/auth.store';
import { extractApiError } from '../utils/error.utils';
import type { AppTabParamList } from './AppNavigator';

type AuthView = 'login' | 'register';

interface AuthNavigatorProps {
  onDismiss?: () => void;
}

/**
 * AuthNavigator — gère le basculement login ↔ register sans tab bar.
 * onDismiss : appelé après connexion réussie quand utilisé en modal.
 */
export default function AuthNavigator({ onDismiss }: AuthNavigatorProps = {}) {
  const { loginAsGuest, isAuthenticated } = useAuthStore();
  const [view, setView] = useState<AuthView>('login');
  const [guestLoading, setGuestLoading] = useState(false);

  // Accès à la navigation tab (disponible quand AuthNavigator est un tab screen)
  let tabNavigation: BottomTabNavigationProp<AppTabParamList> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabNavigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  } catch {}

  // Ferme le modal dès que l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && onDismiss) {
      onDismiss();
    }
  }, [isAuthenticated]);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      // Rediriger vers la carte après connexion en mode invité
      tabNavigation?.navigate('Map');
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      console.warn('Guest login error:', message);
    } finally {
      setGuestLoading(false);
    }
  };

  if (view === 'register') {
    return <RegisterScreen onBack={() => setView('login')} />;
  }

  return (
    <LoginScreen
      onGuestLogin={handleGuestLogin}
      guestLoading={guestLoading}
      onGoToRegister={() => setView('register')}
    />
  );
}
