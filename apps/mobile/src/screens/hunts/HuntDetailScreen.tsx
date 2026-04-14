import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useHuntDetail, useHuntProgress } from '../../hooks/useHunts';
import { huntService } from '../../services/hunt.service';
import type { StepDetail } from '../../services/hunt.service';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type RouteProps = RouteProp<AppStackParamList, 'HuntDetail'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntDetail'>;

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

const STATUS_ICONS: Record<string, string> = {
  completed: '✓',
  current: '▶',
  locked: '🔒',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#22C55E',
  current: '#1D4ED8',
  locked: '#D1D5DB',
};

// ─── StepRow ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: StepDetail;
  onStartStep?: (step: StepDetail) => void;
}

function StepRow({ step, onStartStep }: StepRowProps) {
  const iconColor = STATUS_COLORS[step.status] ?? '#6B7280';
  const isCurrent = step.status === 'current';
  const isLocked = step.status === 'locked';

  return (
    <View style={[styles.stepRow, isCurrent && styles.stepRowCurrent]}>
      <View style={[styles.stepBadge, { backgroundColor: isLocked ? '#F3F4F6' : iconColor + '20' }]}>
        <Text style={[styles.stepBadgeText, { color: isLocked ? '#9CA3AF' : iconColor }]}>
          {STATUS_ICONS[step.status] ?? step.order}
        </Text>
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
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (huntError || !hunt) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Chasse introuvable</Text>
      </View>
    );
  }

  // ── Données dérivées ─────────────────────────────────────────────────────────

  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? '#6B7280';
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty ?? '—';
  const completedCount = progress
    ? progress.steps.filter((s) => s.status === 'completed').length
    : 0;

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
        <Text style={styles.title}>{hunt.title}</Text>

        {hunt.location ? (
          <Text style={styles.location}>📍 {hunt.location}</Text>
        ) : null}

        {hunt.description ? (
          <Text style={styles.description}>{hunt.description}</Text>
        ) : null}

        {/* Méta */}
        <View style={styles.metaRow}>
          {hunt.duration ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>⏱ {hunt.duration} min</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>⭐ {hunt.points} pts</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>📋 {hunt.step_count} étape{hunt.step_count !== 1 ? 's' : ''}</Text>
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
              <Text style={styles.completedBannerText}>🏆 Chasse terminée !</Text>
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
              <ActivityIndicator color="#fff" size="small" />
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
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  errorIcon: { fontSize: 40 },
  errorText: { fontSize: 16, color: '#9CA3AF' },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  metaChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  completedBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  stepRowCurrent: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  stepRowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepBadgePreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    flexShrink: 0,
  },
  stepBadgePreviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  stepTitleLocked: {
    color: '#9CA3AF',
  },
  stepDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  startBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  startBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joinSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 10,
  },
  joinError: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  joinBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnDisabled: {
    opacity: 0.6,
  },
  joinBtnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
