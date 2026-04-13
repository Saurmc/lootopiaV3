import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

/**
 * RootNavigator — point d'entrée de la navigation.
 * - Initialise le store depuis AsyncStorage au démarrage.
 * - Affiche un spinner pendant le chargement.
 * - Bascule automatiquement entre AuthNavigator et AppNavigator selon isAuthenticated.
 */
export default function RootNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
