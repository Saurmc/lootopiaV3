import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import GpsConsentModal from '../components/common/GpsConsentModal';
import ConvertAccountScreen from '../screens/guest/ConvertAccountScreen';
import AuthNavigator from './AuthNavigator';
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
 * Propose de convertir le compte (US59) + toggle localisation GPS.
 */
function GuestProfileScreen() {
  const [convertVisible, setConvertVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const { consentGps, setConsentGps } = useAuthStore();

  return (
    <SafeAreaView style={styles.guestProfileContainer}>
      <ScrollView contentContainerStyle={styles.guestProfile} showsVerticalScrollIndicator={false}>
        <Ionicons name="person-outline" size={56} color={theme.colors.textSecondary} />
        <Text style={styles.guestProfileTitle}>Mode invité</Text>
        <Text style={styles.guestProfileSubtitle}>
          Créez un compte pour sauvegarder votre progression et accéder à toutes les fonctionnalités.
        </Text>
        <TouchableOpacity
          style={styles.convertBtn}
          onPress={() => setAuthVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.convertBtnLabel}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.convertBtnOutline}
          onPress={() => setConvertVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.convertBtnOutlineLabel}>Créer un compte</Text>
        </TouchableOpacity>

        {/* Paramètre localisation */}
        <View style={styles.guestSettingsCard}>
          <Text style={styles.guestSettingsTitle}>Paramètres</Text>
          <View style={styles.guestToggleRow}>
            <View style={styles.guestToggleLeft}>
              <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
              <View>
                <Text style={styles.guestToggleLabel}>Localisation GPS</Text>
                <Text style={styles.guestToggleSub}>
                  Nécessaire pour valider les étapes de chasse
                </Text>
              </View>
            </View>
            <Switch
              value={consentGps === true}
              onValueChange={setConsentGps}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={consentGps === true ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Modal login/register — se ferme automatiquement après connexion */}
        <Modal
          visible={authVisible}
          animationType="slide"
          onRequestClose={() => setAuthVisible(false)}
        >
          <AuthNavigator onDismiss={() => setAuthVisible(false)} />
        </Modal>

        <ConvertAccountScreen
          visible={convertVisible}
          onClose={() => setConvertVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
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
    arContent?: Record<string, unknown> | null;
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

/**
 * TabsRoot — tabs + popup invité au lancement + modal GPS.
 * Séparé pour éviter de re-rendre le NativeStack entier quand l'état change.
 */
function TabsRoot() {
  const { isAuthenticated, isGuest, pendingGpsConsent, setConsentGps } = useAuthStore();
  const guestAlertShown = useRef(false);

  useEffect(() => {
    if (isGuest && !guestAlertShown.current) {
      guestAlertShown.current = true;
      Alert.alert(
        'Mode invité',
        'Votre progression ne sera pas sauvegardée si vous changez d\'appareil. Créez un compte depuis l\'onglet Profil pour ne rien perdre.',
        [{ text: 'Compris', style: 'default' }],
      );
    }
  }, [isGuest]);

  return (
    <View style={styles.root}>

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
          component={isAuthenticated && !isGuest ? ProfileScreen : AuthNavigator}
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
  guestProfileContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  guestProfile: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  guestSettingsCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
    marginTop: theme.spacing.sm,
  },
  guestSettingsTitle: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guestToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  guestToggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  guestToggleLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  guestToggleSub: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  convertBtnOutline: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xl,
  },
  convertBtnOutlineLabel: {
    color: theme.colors.primary,
    ...theme.typography.label,
    fontSize: 15,
  },
});
