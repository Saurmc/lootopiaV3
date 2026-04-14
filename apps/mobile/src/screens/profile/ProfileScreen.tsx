import React from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList, AppStackParamList } from '../../navigation/AppNavigator';
import { useProfile, usePlayerStats } from '../../hooks/useProfile';

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

function StatCard({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
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

  if (profileLoading || statsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
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

        {/* ── Avatar + identité ── */}
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
          {profile?.role && profile.role !== 'player' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{profile.role.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* ── Points mis en évidence ── */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsValue}>{totalPoints.toLocaleString('fr-FR')}</Text>
          <Text style={styles.pointsLabel}>points cumulés</Text>
        </View>

        {/* ── Niveau ── */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelTitle}>{title}</Text>
              <Text style={styles.levelSub}>Niveau {level}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Niv. {level}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text style={styles.progressHint}>
            {isMax
              ? '🏅 Niveau maximum atteint !'
              : `encore ${ptsToNext} pts pour le niveau suivant · ${Math.round(progress * 100)} %`}
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard icon="⭐" value={totalPoints} label="Points" />
          <StatCard icon="🗺" value={stats?.hunt_count ?? 0} label="Chasses" />
          <StatCard icon="✅" value={stats?.completed_hunts ?? 0} label="Terminées" />
          <StatCard icon="🏅" value={stats?.badge_count ?? 0} label="Badges" />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          {/* US60 */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BadgesHistory')}
          >
            <Text style={styles.actionIcon}>🏅</Text>
            <Text style={styles.actionLabel}>Mes badges et historique</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* US61 */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Paramètres</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 16 },

  heroSection: { alignItems: 'center', gap: 6, paddingBottom: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },
  email: { fontSize: 13, color: '#6B7280' },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  pointsCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsValue: { fontSize: 40, fontWeight: '900', color: '#fff' },
  pointsLabel: { fontSize: 13, color: '#BFDBFE', fontWeight: '500' },

  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  levelSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  levelBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  levelBadgeText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressHint: { fontSize: 12, color: '#6B7280' },

  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  actionChevron: { fontSize: 20, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 52 },

  memberSince: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
