import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { useAuthStore } from '../store/auth.store';
import { extractApiError } from '../utils/error.utils';

type AuthTab = 'login' | 'register';

/**
 * AuthNavigator — affiche deux onglets (Se connecter / Créer un compte)
 * et un bouton "Continuer en invité" en bas de page.
 */
export default function AuthNavigator() {
  const { loginAsGuest } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setGuestError(null);
    try {
      await loginAsGuest();
      // RootNavigator bascule automatiquement vers AppNavigator
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      setGuestError(message);
    } finally {
      setGuestLoading(false);
    }
  };

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

      {/* Séparateur */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Bouton invité */}
      <View style={styles.guestContainer}>
        {guestError !== null && (
          <Text style={styles.guestError}>{guestError}</Text>
        )}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleGuestLogin}
          disabled={guestLoading}
          activeOpacity={0.7}
        >
          {guestLoading ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text style={styles.guestBtnLabel}>Continuer en invité</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.guestHint}>
          La progression invité n'est pas garantie si vous changez d'appareil.
        </Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9CA3AF',
  },
  guestContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  guestError: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  guestBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  guestBtnLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  guestHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
