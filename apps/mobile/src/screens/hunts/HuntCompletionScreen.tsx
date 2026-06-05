import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHuntDetail } from '../../hooks/useHunts';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import theme from '../../constants/theme';

type RouteProps = RouteProp<AppStackParamList, 'HuntCompletion'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntCompletion'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  theme.colors.primary, '#3B82F6', theme.colors.success, theme.colors.points,
  '#8B5CF6', '#EC4899', theme.colors.warning, '#06B6D4',
];

const PIECE_COUNT = 22;

// ─── Confetti ────────────────────────────────────────────────────────────────

interface PieceConfig {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

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
        Animated.timing(anim, {
          toValue: 1,
          duration: cfg.duration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, SCREEN_H + 20],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${cfg.rotate}deg`, `${cfg.rotate + 360}deg`],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: cfg.x,
          width: cfg.size,
          height: cfg.size,
          backgroundColor: cfg.color,
          borderRadius: cfg.size / 4,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
}

function Confetti() {
  const pieces = useRef(buildPieces()).current;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((cfg, i) => (
        <ConfettiPiece key={i} cfg={cfg} />
      ))}
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  iconName,
  iconColor,
  label,
  value,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── HuntCompletionScreen ─────────────────────────────────────────────────────

/**
 * HuntCompletionScreen — affiché après avoir complété toutes les étapes d'une chasse.
 * Montre les confettis, le trophée, le titre et les statistiques de la chasse.
 */
export default function HuntCompletionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { huntId, totalPoints, stepCount, startedAt, completedAt } = route.params;

  const { data: hunt } = useHuntDetail(huntId);

  // Durée en minutes
  const durationMin = Math.max(
    1,
    Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
    ),
  );
  const durationLabel =
    durationMin < 60
      ? `${durationMin} min`
      : `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`;

  // Animation d'entrée du trophée
  const trophyScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(trophyScale, {
      toValue: 1,
      bounciness: 12,
      speed: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Confetti />

      <View style={styles.content}>
        {/* Trophée animé */}
        <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>
          🏆
        </Animated.Text>

        {/* Titre */}
        <Text style={styles.congratsTitle}>Félicitations !</Text>
        <Text style={styles.congratsSub}>Tu as terminé la chasse</Text>
        {hunt && (
          <Text style={styles.huntTitle} numberOfLines={2}>{hunt.title}</Text>
        )}

        {/* Badge 100% complète */}
        <View style={styles.completeBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.completeBadgeText}>100% Complète</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard iconName="time-outline" iconColor={theme.colors.textInverse} label="Durée" value={durationLabel} />
          <StatCard iconName="star" iconColor={theme.colors.points} label="Points" value={`${totalPoints}`} />
          <StatCard iconName="list-outline" iconColor={theme.colors.textInverse} label="Étapes" value={`${stepCount}`} />
        </View>

        {/* Boutons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={18} color={theme.colors.textInverse} />
          <Text style={styles.primaryBtnLabel}>Retour à la carte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            // Navigate to Hunts list tab
            navigation.popToTop();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnLabel}>Voir d'autres chasses</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  trophy: {
    fontSize: 88,
    marginBottom: theme.spacing.xs,
  },
  congratsTitle: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  congratsSub: {
    ...theme.typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  huntTitle: {
    ...theme.typography.h3,
    color: theme.colors.points,
    textAlign: 'center',
    lineHeight: 26,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  completeBadgeText: {
    ...theme.typography.label,
    color: theme.colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  statLabel: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  primaryBtnLabel: {
    color: theme.colors.textInverse,
    ...theme.typography.body,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryBtnLabel: {
    ...theme.typography.label,
    color: 'rgba(255,255,255,0.75)',
  },
});
