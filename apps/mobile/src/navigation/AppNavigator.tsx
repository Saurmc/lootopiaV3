import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import GpsConsentModal from '../components/common/GpsConsentModal';
import ConvertAccountScreen from '../screens/guest/ConvertAccountScreen';
import MapScreen from '../screens/map/MapScreen';
import HuntsListScreen from '../screens/hunts/HuntsListScreen';
import HuntDetailScreen from '../screens/hunts/HuntDetailScreen';
import StepValidationScreen from '../screens/hunts/StepValidationScreen';
import HuntCompletionScreen from '../screens/hunts/HuntCompletionScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BadgesScreen from '../screens/profile/BadgesScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import theme from '../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Tab bar entièrement custom — focus détecté via state.index (100% fiable) */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom - theme.spacing.lg, 0) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? theme.colors.tabBarActive : theme.colors.tabBarInactive;
        const label = typeof options.tabBarLabel === 'string'
          ? options.tabBarLabel
          : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
          >
            <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
              {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * GuestProfileScreen — affiché dans l'onglet Profil pour les invités.
 * Propose de convertir le compte ou de voir le profil (US59).
 */
function GuestProfileScreen() {
  const [convertVisible, setConvertVisible] = useState(false);

  return (
    <View style={styles.guestProfile}>
      <Ionicons name="person-outline" size={56} color={theme.colors.textSecondary} />
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


export type AppTabParamList = {
  Map: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  HuntsList: undefined;
  BadgesHistory: undefined;
  Settings: undefined;
  Security: undefined;
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
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarLabel: 'Carte',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={isGuest ? GuestProfileScreen : ProfileScreen}
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
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

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: theme.navigation.headerBackground },
  headerTintColor: theme.colors.textInverse,
  headerTitleStyle: { ...theme.typography.label, color: theme.colors.textInverse },
  headerBackTitle: 'Retour',
};

/**
 * AppNavigator — NativeStack racine englobant les onglets + HuntDetailScreen.
 * Permet la navigation vers HuntDetail depuis n'importe quel onglet.
 */
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsRoot} />
      <Stack.Screen
        name="HuntsList"
        component={HuntsListScreen}
        options={{ headerShown: true, title: 'Chasses disponibles', ...sharedHeaderOptions }}
      />
      <Stack.Screen
        name="BadgesHistory"
        component={BadgesScreen}
        options={{ headerShown: true, title: 'Badges et historique', ...sharedHeaderOptions }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Paramètres', ...sharedHeaderOptions }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ headerShown: true, title: 'Sécurité', ...sharedHeaderOptions }}
      />
      <Stack.Screen
        name="HuntDetail"
        component={HuntDetailScreen}
        options={{ headerShown: true, title: 'Détail de la chasse', ...sharedHeaderOptions }}
      />
      <Stack.Screen
        name="StepValidation"
        component={StepValidationScreen}
        options={{ headerShown: true, title: "Valider l'étape", ...sharedHeaderOptions }}
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 72,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.xs,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    gap: 2,
  },
  tabPillActive: {
    backgroundColor: 'rgba(251,136,117,0.10)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  guestBanner: {
    backgroundColor: theme.colors.warningLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  guestBannerText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  guestProfile: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  guestProfileTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  guestProfileSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  convertBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xl,
  },
  convertBtnLabel: {
    color: theme.colors.textInverse,
    ...theme.typography.label,
    fontSize: 15,
  },
});
