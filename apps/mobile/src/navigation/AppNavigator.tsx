import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import GpsConsentModal from '../components/common/GpsConsentModal';
import ConvertAccountScreen from '../screens/guest/ConvertAccountScreen';
import MapScreen from '../screens/map/MapScreen';
import HuntsListScreen from '../screens/hunts/HuntsListScreen';
import HuntDetailScreen from '../screens/hunts/HuntDetailScreen';
import StepValidationScreen from '../screens/hunts/StepValidationScreen';
import HuntCompletionScreen from '../screens/hunts/HuntCompletionScreen';

/**
 * GuestProfileScreen — affiché dans l'onglet Profil pour les invités.
 * Propose de convertir le compte ou de voir le profil (US59).
 */
function GuestProfileScreen() {
  const [convertVisible, setConvertVisible] = useState(false);

  return (
    <View style={styles.guestProfile}>
      <Text style={styles.guestProfileIcon}>👤</Text>
      <Text style={styles.guestProfileTitle}>Mode invité</Text>
      <Text style={styles.guestProfileSubtitle}>
        Créez un compte pour sauvegarder votre progression et accéder à toutes les fonctionnalités.
      </Text>
      <TouchableOpacity
        style={styles.convertBtn}
        onPress={() => setConvertVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.convertBtnLabel}>Créer un compte</Text>
      </TouchableOpacity>

      <ConvertAccountScreen
        visible={convertVisible}
        onClose={() => setConvertVisible(false)}
      />
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

export type AppStackParamList = {
  Tabs: undefined;
  HuntDetail: { huntId: string };
  StepValidation: {
    huntId: string;
    stepId: string;
    stepTitle: string;
    stepDescription: string | null;
    validationType: string;
    validationRadius: number;
    coordinates: { lat: number; lng: number } | null;
  };
  HuntCompletion: {
    huntId: string;
    totalPoints: number;
    stepCount: number;
    startedAt: string;
    completedAt: string;
  };
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

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
 * TabsRoot — tabs + bannière invité + modal GPS.
 * Séparé pour éviter de re-rendre le NativeStack entier quand l'état change.
 */
function TabsRoot() {
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
          component={MapScreen}
          options={{
            tabBarLabel: 'Carte',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺</Text>,
          }}
        />
        <Tab.Screen
          name="Hunts"
          component={HuntsListScreen}
          options={{
            tabBarLabel: 'Chasses',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔍</Text>,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={isGuest ? GuestProfileScreen : ProfilePlaceholder}
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

/**
 * AppNavigator — NativeStack racine englobant les onglets + HuntDetailScreen.
 * Permet la navigation vers HuntDetail depuis n'importe quel onglet.
 */
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsRoot} />
      <Stack.Screen
        name="HuntDetail"
        component={HuntDetailScreen}
        options={{
          headerShown: true,
          title: 'Détail de la chasse',
          headerBackTitle: 'Retour',
          headerTintColor: '#1D4ED8',
          headerTitleStyle: { fontSize: 16, fontWeight: '600', color: '#111827' },
        }}
      />
      <Stack.Screen
        name="StepValidation"
        component={StepValidationScreen}
        options={{
          headerShown: true,
          title: 'Valider l\'étape',
          headerBackTitle: 'Retour',
          headerTintColor: '#1D4ED8',
          headerTitleStyle: { fontSize: 16, fontWeight: '600', color: '#111827' },
        }}
      />
      <Stack.Screen
        name="HuntCompletion"
        component={HuntCompletionScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
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
  guestProfile: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  guestProfileIcon: {
    fontSize: 56,
  },
  guestProfileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  guestProfileSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  convertBtn: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },
  convertBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
