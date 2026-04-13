import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

type AuthTab = 'login' | 'register';

/**
 * AuthNavigator — affiche deux onglets (Se connecter / Créer un compte).
 * Le basculement auth → app est piloté par le store Zustand, pas par la navigation.
 */
export default function AuthNavigator() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.logo}>Lootopia</Text>
        <Text style={styles.tagline}>Partez à la découverte</Text>
      </View>

      {/* Barre d'onglets */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.tabActive]}
          onPress={() => setActiveTab('login')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'login' && styles.tabLabelActive]}>
            Se connecter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.tabActive]}
          onPress={() => setActiveTab('register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'register' && styles.tabLabelActive]}>
            Créer un compte
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {activeTab === 'login' ? <LoginScreen /> : <RegisterScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
