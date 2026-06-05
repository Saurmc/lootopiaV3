import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useHuntDetail, useHuntProgress } from '../../hooks/useHunts';
import { huntService } from '../../services/hunt.service';
import type { StepDetail } from '../../services/hunt.service';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import theme from '../../constants/theme';

type RouteProps = RouteProp<AppStackParamList, 'HuntDetail'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntDetail'>;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: theme.colors.difficultyEasy,
  medium: theme.colors.difficultyMedium,
  hard: theme.colors.difficultyHard,
};

const STATUS_COLORS: Record<string, string> = {
  completed: theme.colors.success,
  current: theme.colors.primary,
  locked: theme.colors.textDisabled,
};

// ─── StepRow ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: StepDetail;
  onStartStep?: (step: StepDetail) => void;
}

function StepRow({ step, onStartStep }: StepRowProps) {
  const iconColor = STATUS_COLORS[step.status] ?? theme.colors.textSecondary;
  const isCurrent = step.status === 'current';
  const isLocked = step.status === 'locked';

  const badgeIcon =
    step.status === 'completed' ? 'checkmark' :
    step.status === 'current' ? 'play' :
    'lock-closed';

  return (
    <View style={[styles.stepRow, isCurrent && styles.stepRowCurrent]}>
      <View style={[styles.stepBadge, { backgroundColor: isLocked ? theme.colors.surfaceElevated : iconColor + '22' }]}>
        <Ionicons name={badgeIcon} size={16} color={isLocked ? theme.colors.textDisabled : iconColor} />
      </View>

      <View style={styles.stepInfo}>
        <Text style={[styles.stepTitle, isLocked && styles.stepTitleLocked]} numberOfLines={1}>
          {step.title}
        </Text>
        {step.description && !isLocked ? (
          <Text style={styles.stepDesc} numberOfLines={2}>{step.description}</Text>
        ) : null}
      </View>

      {isCurrent && onStartStep && (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => onStartStep(step)}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnLabel}>Commencer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? completed / total : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {completed} / {total} étape{total !== 1 ? 's' : ''} complétée{completed !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ─── HuntDetailScreen ─────────────────────────────────────────────────────────

/**
 * HuntDetailScreen — détail d'une chasse avec ses étapes.
 * - Si le joueur n'a pas rejoint : bouton "Rejoindre la chasse"
 * - Si le joueur a rejoint : progression + liste des étapes avec statut
 */
export default function HuntDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { huntId } = route.params;
  const queryClient = useQueryClient();

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { data: hunt, isLoading: huntLoading, isError: huntError } = useHuntDetail(huntId);
  const { data: progress, isLoading: progressLoading } = useHuntProgress(huntId);

  const isLoading = huntLoading || progressLoading;

  const handleJoin = async () => {
    setJoining(true);
    setJoinError(null);
    try {
      await huntService.joinHunt(huntId);
      // Refetch progress to update the screen
      await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
    } catch {
      setJoinError('Impossible de rejoindre la chasse. Réessayez.');
    } finally {
      setJoining(false);
    }
  };

  // US54/US55 : navigation vers l'écran de validation de l'étape (GPS ou QR)
  const handleStartStep = (step: StepDetail) => {
    navigation.navigate('StepValidation', {
      huntId,
      stepId: step.id,
      stepTitle: step.title,
      stepDescription: step.description,
      validationType: step.validation_type,
      validationRadius: step.validation_radius,
      coordinates: step.coordinates,
    });
  };

  // ── États de chargement / erreur ────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (huntError || !hunt) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={40} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Chasse introuvable</Text>
      </View>
    );
  }

  // ── Données dérivées ─────────────────────────────────────────────────────────

  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? theme.colors.textSecondary;
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty ?? '—';
  const completedCount = progress
    ? progress.steps.filter((s) => s.status === 'completed').length
    : 0;

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête violet */}
      <View style={styles.header}>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '33' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
        <Text style={styles.title}>{hunt.title}</Text>

        {hunt.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.location}>{hunt.location}</Text>
          </View>
        ) : null}

        {hunt.description ? (
          <Text style={styles.description}>{hunt.description}</Text>
        ) : null}

        {/* Méta */}
        <View style={styles.metaRow}>
          {hunt.duration ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textInverse} />
              <Text style={styles.metaChipText}>{hunt.duration} min</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="star" size={12} color={theme.colors.points} />
            <Text style={styles.metaChipText}>{hunt.points} pts</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="list-outline" size={12} color={theme.colors.textInverse} />
            <Text style={styles.metaChipText}>{hunt.step_count} étape{hunt.step_count !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Progression (si rejoint) */}
      {progress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ma progression</Text>
          <ProgressBar completed={completedCount} total={progress.steps.length} />
          {progress.completed_at && (
            <View style={styles.completedBanner}>
              <Ionicons name="trophy" size={18} color={theme.colors.success} />
              <Text style={styles.completedBannerText}>Chasse terminée !</Text>
            </View>
          )}
        </View>
      )}

      {/* Étapes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {progress ? 'Étapes' : `Aperçu des étapes (${hunt.step_count})`}
        </Text>

        {progress ? (
          // Étapes avec statut
          progress.steps.map((step) => (
            <StepRow key={step.id} step={step} onStartStep={handleStartStep} />
          ))
        ) : (
          // Aperçu sans statut
          hunt.steps.map((step) => (
            <View key={step.id} style={styles.stepRowPreview}>
              <View style={styles.stepBadgePreview}>
                <Text style={styles.stepBadgePreviewText}>{step.order}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle} numberOfLines={1}>{step.title}</Text>
                {step.description ? (
                  <Text style={styles.stepDesc} numberOfLines={2}>{step.description}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Bouton Rejoindre (si pas encore rejoint) */}
      {!progress && (
        <View style={styles.joinSection}>
          {joinError && <Text style={styles.joinError}>{joinError}</Text>}
          <TouchableOpacity
            style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.8}
          >
            {joining ? (
              <ActivityIndicator color={theme.colors.textInverse} size="small" />
            ) : (
              <Text style={styles.joinBtnLabel}>Rejoindre la chasse</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    backgroundColor: theme.colors.gradientStart,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  diffText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
  },
  description: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metaChipText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '500',
  },
  section: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    gap: theme.spacing.sm,
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
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.success + '44',
  },
  completedBannerText: {
    ...theme.typography.label,
    color: theme.colors.success,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  stepRowCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  stepRowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepBadgePreview: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    flexShrink: 0,
  },
  stepBadgePreviewText: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },
  stepInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  stepTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  stepTitleLocked: {
    color: theme.colors.textDisabled,
  },
  stepDesc: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  startBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexShrink: 0,
  },
  startBtnLabel: {
    color: theme.colors.textInverse,
    ...theme.typography.caption,
    fontWeight: '600',
  },
  joinSection: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  joinError: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
  },
  joinBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
  joinBtnDisabled: {
    opacity: 0.6,
  },
  joinBtnLabel: {
    color: theme.colors.textInverse,
    ...theme.typography.body,
    fontWeight: '700',
  },
});
