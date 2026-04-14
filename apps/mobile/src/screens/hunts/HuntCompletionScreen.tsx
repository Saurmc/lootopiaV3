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
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHuntDetail } from '../../hooks/useHunts';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type RouteProps = RouteProp<AppStackParamList, 'HuntCompletion'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntCompletion'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#F59E0B',
  '#8B5CF6', '#EC4899', '#F97316', '#06B6D4',
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
        <Text style={styles.congratsSub}>
          Tu as terminé la chasse
        </Text>
        {hunt && (
          <Text style={styles.huntTitle} numberOfLines={2}>{hunt.title}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="⭐" label="Points" value={`${totalPoints}`} />
          <StatCard icon="📋" label="Étapes" value={`${stepCount}`} />
          <StatCard icon="⏱" label="Durée" value={durationLabel} />
        </View>

        {/* Boutons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnLabel}>🗺 Retour à la carte</Text>
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
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  trophy: {
    fontSize: 88,
    marginBottom: 4,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  congratsSub: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
  huntTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FCD34D',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: { fontSize: 22 },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnLabel: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
});
