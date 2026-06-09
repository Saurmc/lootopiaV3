import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { useOfflineSync } from '../hooks/useOfflineSync';
import AppNavigator from './AppNavigator';

/**
 * RootNavigator — point d'entrée de la navigation.
 * L'app démarre toujours sur AppNavigator (carte accessible sans connexion).
 * L'authentification n'est requise que pour l'onglet Profil.
 */
export default function RootNavigator() {
  const { isLoading, initialize } = useAuthStore();
  useOfflineSync();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

import theme from '../constants/theme';

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
