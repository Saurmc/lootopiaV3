import React, { useState } from 'react';
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
import { useProfile, usePlayerStats, useBadges } from '../../hooks/useProfile';
import { useHuntHistory, useHuntsList } from '../../hooks/useHunts';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(startedAt: string, completedAt: string): string {
  const mins = Math.max(1, Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
  ));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── CompletedHuntCard ────────────────────────────────────────────────────────

interface CompletedHuntCardProps {
  title: string;
  location: string | null;
  points: number;
  startedAt: string;
  completedAt: string;
}

function CompletedHuntCard({ title, location, points, startedAt, completedAt }: CompletedHuntCardProps) {
  return (
    <View style={styles.huntCard}>
      <View style={styles.huntIconBox}>
        <Ionicons name="compass" size={22} color={theme.colors.textInverse} />
      </View>
      <View style={styles.huntCardContent}>
        <Text style={styles.huntCardTitle} numberOfLines={1}>{title}</Text>
        {location ? (
          <Text style={styles.huntCardLocation} numberOfLines={1}>{location}</Text>
        ) : null}
        <View style={styles.huntCardMeta}>
          <Ionicons name="time-outline" size={11} color={theme.colors.textSecondary} />
          <Text style={styles.huntCardMetaText}>{formatDuration(startedAt, completedAt)}</Text>
          <Ionicons name="star" size={11} color={theme.colors.points} />
          <Text style={styles.huntCardMetaText}>{points} pts</Text>
          <Ionicons name="calendar-outline" size={11} color={theme.colors.textSecondary} />
          <Text style={styles.huntCardMetaText}>{formatDate(completedAt)}</Text>
        </View>
      </View>
      <View style={styles.huntCompleteBadge}>
        <Ionicons name="checkmark" size={11} color={theme.colors.success} />
        <Text style={styles.huntCompleteBadgeText}>100%</Text>
      </View>
    </View>
  );
}

// ─── Badge metadata ───────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BADGE_META: Record<string, { label: string; icon: IoniconName; color: string }> = {
  first_hunt:      { label: 'Premier pas',      icon: 'flag',             color: theme.colors.points },
  hunt_completed:  { label: 'Chasse terminée',  icon: 'trophy',           color: theme.colors.primary },
  hunt_5:          { label: '5 chasses',        icon: 'compass',          color: theme.colors.warning },
  streak_3:        { label: 'Série de 3',       icon: 'flame',            color: theme.colors.error },
  precision:       { label: 'Précision',        icon: 'locate',           color: '#3B82F6' },
  points_1000:     { label: '1000 points',      icon: 'star',             color: theme.colors.points },
  explorer:        { label: 'Explorateur',      icon: 'earth',            color: theme.colors.success },
};

function getBadgeMeta(type: string) {
  return BADGE_META[type] ?? { label: type, icon: 'ribbon' as IoniconName, color: theme.colors.gradientStart };
}

function chunkBadges<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── BadgeCard ────────────────────────────────────────────────────────────────

function BadgeCard({ badge_type }: { badge_type: string }) {
  const { label, icon, color } = getBadgeMeta(badge_type);
  return (
    <View style={styles.badgeCard}>
      <View style={[styles.badgeIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.badgeLabel} numberOfLines={2}>{label}</Text>
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
  const { data: history = [] } = useHuntHistory();
  const { data: allHunts = [] } = useHuntsList('');
  const { data: badges = [] } = useBadges();
  const { logout } = useAuthStore();
  const [huntsExpanded, setHuntsExpanded] = useState(true);
  const [badgesExpanded, setBadgesExpanded] = useState(true);

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

  const completedHunts = history
    .filter((h) => h.completed_at !== null)
    .map((h) => {
      const hunt = allHunts.find((hu) => hu.id === h.hunt_id);
      return hunt ? { ...h, title: hunt.title, location: hunt.location } : null;
    })
    .filter(Boolean) as Array<typeof history[0] & { title: string; location: string | null }>;

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

          {profile?.role && profile.role.toLowerCase() !== 'player' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{profile.role.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* ── 3 mini stats directement sous le hero ── */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatValue}>{stats?.hunt_count ?? 0}</Text>
            <Text style={styles.miniStatLabel}>Chasses</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatValue}>
              {totalPoints >= 1000
                ? `${(totalPoints / 1000).toFixed(1).replace('.0', '')}k`
                : totalPoints}
            </Text>
            <Text style={styles.miniStatLabel}>Points</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatValue}>{stats?.badge_count ?? 0}</Text>
            <Text style={styles.miniStatLabel}>Badges</Text>
          </View>
        </View>



        {/* ── Chasses complétées (collapsible) ── */}
        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setHuntsExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.collapsibleTitle}>
              Chasses Complétées{completedHunts.length > 0 ? ` (${completedHunts.length})` : ''}
            </Text>
            <Ionicons
              name={huntsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {huntsExpanded && (
            completedHunts.length > 0 ? (
              <View style={styles.huntList}>
                {completedHunts.map((h) => (
                  <CompletedHuntCard
                    key={h.hunt_id}
                    title={h.title}
                    location={h.location}
                    points={h.total_points}
                    startedAt={h.started_at}
                    completedAt={h.completed_at!}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyHunts}>Aucune chasse terminée pour l'instant.</Text>
            )
          )}
        </View>

        {/* ── Badges obtenus (collapsible) ── */}
        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setBadgesExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.collapsibleTitle}>
              Badges Obtenus{badges.length > 0 ? ` (${badges.length})` : ''}
            </Text>
            <Ionicons
              name={badgesExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {badgesExpanded && (
            badges.length > 0 ? (
              <View style={styles.badgeGrid}>
                {chunkBadges(badges, 3).map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.badgeRow}>
                    {row.map((b) => (
                      <BadgeCard key={b.id} badge_type={b.badge_type} />
                    ))}
                    {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                      <View key={`ph-${i}`} style={styles.badgeCardPlaceholder} />
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyHunts}>Aucun badge obtenu pour l'instant.</Text>
            )
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
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

  miniStatsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  miniStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  miniStatValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  miniStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
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

  collapsibleSection: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  collapsibleTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
  },
  huntList: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  huntCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  huntIconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.huntIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  huntCardContent: {
    flex: 1,
    gap: 3,
  },
  huntCardTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  huntCardLocation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  huntCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  huntCardMetaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  huntCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    flexShrink: 0,
  },
  huntCompleteBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: '700',
  },
  emptyHunts: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },

  badgeGrid: {
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  badgeCardPlaceholder: {
    flex: 1,
  },
  badgeIconBox: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
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
