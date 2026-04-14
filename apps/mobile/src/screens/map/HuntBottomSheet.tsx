import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { HuntMapItem } from '../../services/hunt.service';
import { formatDistance } from '../../services/hunt.service';

interface Props {
  hunt: HuntMapItem | null;
  userLat: number | null;
  userLng: number | null;
  onClose: () => void;
  onJoin: (hunt: HuntMapItem) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F97316',
  hard: '#EF4444',
};

/**
 * HuntBottomSheet — panneau glissant affiché au tap d'un marqueur de chasse.
 * Contient : titre, description, difficulté, distance, bouton "Rejoindre".
 */
export default function HuntBottomSheet({ hunt, userLat, userLng, onClose, onJoin }: Props) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: hunt ? 0 : 300,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [hunt]);

  if (!hunt) return null;

  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? '#6B7280';
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty ?? '—';

  const distance =
    userLat !== null && userLng !== null
      ? formatDistance(
          // haversine inline pour éviter un import circulaire
          (() => {
            const R = 6_371_000;
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(hunt.lat - userLat);
            const dLng = toRad(hunt.lng - userLng);
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(userLat)) *
                Math.cos(toRad(hunt.lat)) *
                Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          })(),
        )
      : null;

  return (
    <>
      {/* Fond semi-transparent pour fermer */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.diffBadge}>
            <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Titre */}
        <Text style={styles.title} numberOfLines={2}>{hunt.title}</Text>

        {/* Description */}
        {hunt.description ? (
          <Text style={styles.description} numberOfLines={3}>{hunt.description}</Text>
        ) : null}

        {/* Méta */}
        <View style={styles.meta}>
          {distance && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{distance}</Text>
            </View>
          )}
          {hunt.duration ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>{hunt.duration} min</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⭐</Text>
            <Text style={styles.metaText}>{hunt.points} pts</Text>
          </View>
        </View>

        {/* Bouton Rejoindre */}
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => onJoin(hunt)}
          activeOpacity={0.8}
        >
          <Text style={styles.joinBtnLabel}>Rejoindre</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diffBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  diffText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
