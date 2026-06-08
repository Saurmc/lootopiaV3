import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HuntListItem } from '../../services/hunt.service';
import { formatDistance } from '../../services/hunt.service';
import { useTranslation } from 'react-i18next';
import theme from '../../constants/theme';

interface Props {
  hunt: HuntListItem | null;
  userLat: number | null;
  userLng: number | null;
  onClose: () => void;
  onJoin: (hunt: HuntListItem) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: theme.colors.difficultyEasy,
  medium: theme.colors.difficultyMedium,
  hard: theme.colors.difficultyHard,
};

/**
 * HuntBottomSheet — panneau glissant affiché au tap d'un marqueur de chasse.
 */
export default function HuntBottomSheet({ hunt, userLat, userLng, onClose, onJoin }: Props) {
  const { t } = useTranslation();
  const DIFFICULTY_LABELS: Record<string, string> = {
    easy: t('common.easy'),
    medium: t('common.medium'),
    hard: t('common.hard'),
  };
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: hunt ? 0 : 300,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [hunt]);

  if (!hunt) return null;

  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? theme.colors.textSecondary;
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty ?? '—';

  const distance =
    userLat !== null && userLng !== null && hunt.lat !== null && hunt.lng !== null
      ? formatDistance(
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
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header : badge difficulté + fermer */}
        <View style={styles.header}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Icône + Titre */}
        <View style={styles.titleRow}>
          <View style={styles.huntIconBox}>
            <Ionicons name="compass" size={22} color={theme.colors.textInverse} />
          </View>
          <Text style={styles.title} numberOfLines={2}>{hunt.title}</Text>
        </View>

        {/* Localisation */}
        {hunt.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{hunt.location}</Text>
          </View>
        ) : null}

        {/* Description */}
        {hunt.description ? (
          <Text style={styles.description} numberOfLines={2}>{hunt.description}</Text>
        ) : null}

        {/* Méta */}
        <View style={styles.meta}>
          {distance && (
            <View style={styles.metaItem}>
              <Ionicons name="map-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{distance}</Text>
            </View>
          )}
          {hunt.duration ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{hunt.duration} {t('common.min')}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color={theme.colors.points} />
            <Text style={styles.metaText}>{hunt.points} {t('common.pts')}</Text>
          </View>
        </View>

        {/* Bouton Rejoindre */}
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => onJoin(hunt)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={16} color={theme.colors.textInverse} />
          <Text style={styles.joinBtnLabel}>{t('bottomSheet.join')}</Text>
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
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  diffBadge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  diffText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  huntIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.huntIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.elevated,
  },
  joinBtnLabel: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    fontSize: 15,
  },
});
