import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import GpsConsentModal from '../components/common/GpsConsentModal';

// --- Placeholders pour les US à venir ---
function MapPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>🗺</Text>
      <Text style={styles.placeholderText}>Carte (US50)</Text>
    </View>
  );
}

function ListPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>📋</Text>
      <Text style={styles.placeholderText}>Chasses (US52)</Text>
    </View>
  );
}

function ProfilePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>👤</Text>
      <Text style={styles.placeholderText}>Profil (US59)</Text>
    </View>
  );
}

export type AppTabParamList = {
  Map: undefined;
  Hunts: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

/** Bannière ambre persistante pour les joueurs invités. */
function GuestBanner() {
  return (
    <View style={styles.guestBanner}>
      <Text style={styles.guestBannerText}>
        Mode invité — Créez un compte pour sauvegarder votre progression
      </Text>
    </View>
  );
}

/**
 * AppNavigator — bottom tabs pour le joueur authentifié.
 * Affiche une bannière invité et la modal de consentement GPS si nécessaire.
 */
export default function AppNavigator() {
  const { isGuest, pendingGpsConsent, setConsentGps } = useAuthStore();

  return (
    <View style={styles.root}>
      {isGuest && <GuestBanner />}

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#fff',
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapPlaceholder}
          options={{
            tabBarLabel: 'Carte',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺</Text>,
          }}
        />
        <Tab.Screen
          name="Hunts"
          component={ListPlaceholder}
          options={{
            tabBarLabel: 'Chasses',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔍</Text>,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfilePlaceholder}
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
          }}
        />
      </Tab.Navigator>

      <GpsConsentModal
        visible={pendingGpsConsent}
        onAccept={() => setConsentGps(true)}
        onDecline={() => setConsentGps(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  placeholderIcon: {
    fontSize: 48,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  guestBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  guestBannerText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
});
