import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHuntDetail } from '../../hooks/useHunts';
import { useBadges } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/auth.store';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import theme from '../../constants/theme';

const GUEST_COMPLETED_KEY = 'guest_completed_hunts';

type RouteProps = RouteProp<AppStackParamList, 'HuntCompletion'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntCompletion'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  theme.colors.primary, '#3B82F6', theme.colors.success, theme.colors.points,
  '#8B5CF6', '#EC4899', theme.colors.warning, '#06B6D4',
];

const PIECE_COUNT = 22;

interface BadgeDef { type: string; icon: string; name: string }
const BADGE_CATALOG: BadgeDef[] = [
  { type: 'first_hunt',      icon: '🏁', name: 'Première chasse' },
  { type: 'hunt_completed',  icon: '🏆', name: 'Chasseur' },
  { type: 'explorer',        icon: '🗺', name: 'Explorateur' },
  { type: 'collector',       icon: '💎', name: 'Collectionneur' },
  { type: 'speedrunner',     icon: '⚡', name: 'Speedrunner' },
  { type: 'legend',          icon: '🌟', name: 'Légende' },
];

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface PieceConfig { x: number; size: number; color: string; delay: number; duration: number; rotate: number }

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

function buildPieces(): PieceConfig[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    x: randomBetween(0, SCREEN_W - 12),
    size: randomBetween(6, 14),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: randomBetween(0, 1200),
    duration: randomBetween(2200, 3800),
    rotate: randomBetween(0, 360),
  }));
}

function ConfettiPiece({ cfg }: { cfg: PieceConfig }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.timing(anim, { toValue: 1, duration: cfg.duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, SCREEN_H + 20] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: [`${cfg.rotate}deg`, `${cfg.rotate + 360}deg`] });
  const opacity = anim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      style={[styles.confettiPiece, { left: cfg.x, width: cfg.size, height: cfg.size, backgroundColor: cfg.color, borderRadius: cfg.size / 4, opacity, transform: [{ translateY }, { rotate }] }]}
    />
  );
}

function Confetti() {
  const pieces = useRef(buildPieces()).current;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((cfg, i) => <ConfettiPiece key={i} cfg={cfg} />)}
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── HuntCompletionScreen ─────────────────────────────────────────────────────

export default function HuntCompletionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { huntId, totalPoints, stepCount, startedAt, completedAt } = route.params;

  const queryClient = useQueryClient();
  const isGuest = useAuthStore((s) => s.isGuest);

  const { data: hunt } = useHuntDetail(huntId);
  const { data: allBadges = [] } = useBadges();

  // Invalide les caches profil dès l'arrivée sur cet écran
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['me', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['me', 'badges'] });
    queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
    queryClient.invalidateQueries({ queryKey: ['hunts', 'history'] });
  }, []);

  // Badges gagnés à la complétion (earned dans les 2 minutes autour de completedAt)
  const completedTs = new Date(completedAt).getTime();
  const newBadges = allBadges.filter((b) => {
    const diff = Math.abs(new Date(b.earned_at).getTime() - completedTs);
    return diff < 120_000;
  });

  // Durée
  const durationMin = Math.max(1, Math.round((completedTs - new Date(startedAt).getTime()) / 60_000));
  const durationLabel = durationMin < 60 ? `${durationMin} min` : `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`;

  // Sauvegarde locale pour les invités (fallback si compte supprimé)
  const saveGuestProgress = async () => {
    try {
      const raw = await AsyncStorage.getItem(GUEST_COMPLETED_KEY);
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
      const entry = { huntId, totalPoints, stepCount, completedAt, savedAt: new Date().toISOString() };
      await AsyncStorage.setItem(GUEST_COMPLETED_KEY, JSON.stringify([...existing, entry]));
    } catch { /* silencieux */ }
  };

  // Invalide les caches et navigue (commun aux deux boutons)
  const saveAndGo = async (then: () => void) => {
    if (isGuest) await saveGuestProgress();
    queryClient.invalidateQueries({ queryKey: ['me', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['me', 'badges'] });
    queryClient.invalidateQueries({ queryKey: ['hunts', 'history'] });
    then();
  };

  // Animation trophée
  const trophyScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(trophyScale, { toValue: 1, bounciness: 12, speed: 6, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Confetti />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trophée */}
        <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>🏆</Animated.Text>

        {/* Titres */}
        <Text style={styles.congratsTitle}>Félicitations !</Text>
        <Text style={styles.congratsSub}>Chasse terminée avec succès</Text>

        {/* 100% Complété */}
        <View style={styles.completeBadge}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.completeBadgeText}>100% Complété</Text>
        </View>

        {/* Encadré chasse */}
        {hunt && (
          <View style={styles.huntCard}>
            <Text style={styles.huntCardTitle} numberOfLines={2}>{hunt.title}</Text>
            {hunt.location ? (
              <View style={styles.huntCardLocation}>
                <Ionicons name="location-outline" size={13} color={theme.colors.textSecondary} />
                <Text style={styles.huntCardLocationText} numberOfLines={1}>{hunt.location}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="⏱" label="Durée" value={durationLabel} />
          <StatCard icon="⭐" label="Points" value={`${totalPoints}`} />
          <StatCard icon="✅" label="Étapes" value={`${stepCount}/${stepCount}`} />
        </View>

        {/* Récompenses débloquées */}
        <View style={styles.rewardsBox}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsIcon}>🔥</Text>
            <Text style={styles.rewardsTitle}>Récompenses débloquées</Text>
          </View>

          {newBadges.length === 0 && (
            <View style={styles.rewardChip}>
              <Text style={styles.rewardChipText}>🏆 Chasseur</Text>
            </View>
          )}
          {newBadges.map((b) => {
            const def = BADGE_CATALOG.find((d) => d.type === b.badge_type);
            return (
              <View key={b.id} style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>{def?.icon ?? '🎖'} {def?.name ?? b.badge_type}</Text>
              </View>
            );
          })}

          <View style={[styles.rewardChip, styles.rewardChipXp]}>
            <Text style={[styles.rewardChipText, styles.rewardChipXpText]}>+ {totalPoints} XP</Text>
          </View>
        </View>

        {/* Boutons — invité */}
        {isGuest ? (
          <>
            <View style={styles.guestBanner}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.points} />
              <Text style={styles.guestBannerText}>
                Créez un compte pour conserver votre progression et vos badges définitivement.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => saveAndGo(() => {
                navigation.popToTop();
                navigation.navigate('Profile' as any);
              })}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={18} color={theme.colors.textInverse} />
              <Text style={styles.primaryBtnLabel}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => saveAndGo(() => navigation.popToTop())}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnLabel}>Continuer sans compte</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Boutons — utilisateur connecté */
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => saveAndGo(() => navigation.popToTop())}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={18} color={theme.colors.textInverse} />
              <Text style={styles.primaryBtnLabel}>Sauvegarder ma progression</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => saveAndGo(() => {
                navigation.popToTop();
                navigation.navigate('HuntDetail', { huntId });
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnLabel}>Voir les détails</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  confettiPiece: { position: 'absolute', top: 0 },

  trophy: { fontSize: 80, marginBottom: theme.spacing.xs },

  congratsTitle: { ...theme.typography.h1, color: theme.colors.textInverse, textAlign: 'center' },
  congratsSub: { ...theme.typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  completeBadgeText: { ...theme.typography.body, color: theme.colors.success, fontWeight: '700' },

  huntCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  huntCardTitle: { ...theme.typography.h3, color: theme.colors.textInverse, textAlign: 'center', fontWeight: '700' },
  huntCardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  huntCardLocationText: { ...theme.typography.caption, color: 'rgba(255,255,255,0.6)' },

  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statIcon: { fontSize: 20 },
  statValue: { ...theme.typography.h3, color: theme.colors.textInverse },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  rewardsBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rewardsHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: 4 },
  rewardsIcon: { fontSize: 18 },
  rewardsTitle: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '700' },
  rewardChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  rewardChipText: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '600' },
  rewardChipXp: { backgroundColor: `${theme.colors.points}22`, borderWidth: 1, borderColor: `${theme.colors.points}55` },
  rewardChipXpText: { color: theme.colors.points },

  guestBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: `${theme.colors.points}1A`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.points}44`,
  },
  guestBannerText: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.elevated,
  },
  primaryBtnLabel: { color: theme.colors.textInverse, ...theme.typography.body, fontWeight: '700' },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryBtnLabel: { ...theme.typography.label, color: 'rgba(255,255,255,0.75)' },
});
