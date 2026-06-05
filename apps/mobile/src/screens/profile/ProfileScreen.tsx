import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppNavigator';
import { useProfile, usePlayerStats } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/auth.store';
import theme from '../../constants/theme';

type ProfileNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

// ─── Système de niveaux ───────────────────────────────────────────────────────

const TITLES = [
  'Novice',
  'Explorateur',
  'Aventurier',
  'Chasseur',
  'Traqueur',
  'Expert',
  'Maître',
  'Légende',
];
const POINTS_PER_LEVEL = 200;
const MAX_LEVEL = TITLES.length;

function computeLevel(points: number) {
  const rawLevel = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const level = Math.min(rawLevel, MAX_LEVEL);
  const title = TITLES[level - 1];
  const isMax = level >= MAX_LEVEL;
  const progress = isMax ? 1 : (points - (level - 1) * POINTS_PER_LEVEL) / POINTS_PER_LEVEL;
  const ptsToNext = isMax ? null : level * POINTS_PER_LEVEL - points;
  return { level, title, progress, ptsToNext, isMax };
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  iconName,
  iconColor,
  value,
  label,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  value: number | string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={iconName} size={20} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

/**
 * ProfileScreen — profil d'un joueur authentifié (non invité).
 * Affiche pseudo, avatar, niveau, barre de progression vers le suivant et stats.
 */
export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = usePlayerStats();
  const { logout } = useAuthStore();

  if (profileLoading || statsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const displayName = profile?.pseudo ?? profile?.email ?? 'Joueur';
  const initials = displayName.slice(0, 2).toUpperCase();
  const totalPoints = stats?.total_points ?? 0;
  const { level, title, progress, ptsToNext, isMax } = computeLevel(totalPoints);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero — fond violet ── */}
        <View style={styles.heroSection}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <Text style={styles.displayName}>{displayName}</Text>
          {profile?.email && profile.pseudo && (
            <Text style={styles.email}>{profile.email}</Text>
          )}

          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Niveau {level}</Text>
            </View>
            <Text style={styles.levelTitle}>{title}</Text>
          </View>

          {profile?.role && profile.role !== 'player' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{profile.role.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* ── Points mis en évidence ── */}
        <View style={styles.pointsCard}>
          <Ionicons name="star" size={24} color={theme.colors.points} />
          <Text style={styles.pointsValue}>{totalPoints.toLocaleString('fr-FR')}</Text>
          <Text style={styles.pointsLabel}>points cumulés</Text>
        </View>

        {/* ── Niveau ── */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardHeader}>
            <View>
              <Text style={styles.levelCardTitle}>{title}</Text>
              <Text style={styles.levelCardSub}>Niveau {level}</Text>
            </View>
            <View style={styles.levelCardBadge}>
              <Text style={styles.levelCardBadgeText}>Niv. {level}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text style={styles.progressHint}>
            {isMax
              ? 'Niveau maximum atteint !'
              : `encore ${ptsToNext} pts pour le niveau suivant · ${Math.round(progress * 100)} %`}
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard iconName="star" iconColor={theme.colors.points} value={totalPoints} label="Points" />
          <StatCard iconName="map" iconColor={theme.colors.primary} value={stats?.hunt_count ?? 0} label="Chasses" />
          <StatCard iconName="checkmark-circle" iconColor={theme.colors.success} value={stats?.completed_hunts ?? 0} label="Terminées" />
          <StatCard iconName="ribbon" iconColor={theme.colors.gradientStart} value={stats?.badge_count ?? 0} label="Badges" />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          {/* US60 */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BadgesHistory')}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="ribbon-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Mes badges et historique</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* US61 */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert('Se déconnecter', 'Confirmer la déconnexion ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Déconnexion', style: 'destructive', onPress: logout },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Membre depuis */}
        {profile?.created_at && (
          <Text style={styles.memberSince}>
            Membre depuis{' '}
            {new Date(profile.created_at).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },

  heroSection: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.gradientStart,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: theme.borderRadius.full,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gradientEnd,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  displayName: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    marginTop: theme.spacing.xs,
  },
  email: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.65)',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  levelBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  levelBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  levelTitle: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.warning + '66',
  },
  roleBadgeText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.text,
  },

  pointsCard: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
    ...theme.shadows.elevated,
  },
  pointsValue: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
  },
  pointsLabel: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  levelCard: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelCardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  levelCardSub: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  levelCardBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary + '33',
  },
  levelCardBadgeText: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.progressFill,
    borderRadius: theme.borderRadius.full,
  },
  progressHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  statValue: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.text,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  actionsSection: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: 68,
  },

  memberSince: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '44',
    backgroundColor: theme.colors.errorLight,
  },
  logoutLabel: {
    ...theme.typography.label,
    color: theme.colors.error,
  },
});
