import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import ARSection from '../../components/step/ARSection';
import type { ArContent } from '../../components/step/ARSection';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useHuntDetail, useHuntProgress } from '../../hooks/useHunts';
import { huntService } from '../../services/hunt.service';
import { haversineDistance, formatDistance } from '../../services/hunt.service';
import type { StepDetail, StepStatus, HuntProgress } from '../../services/hunt.service';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import theme from '../../constants/theme';

type RouteProps = RouteProp<AppStackParamList, 'HuntDetail'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'HuntDetail'>;

type ValidationState = 'idle' | 'locating' | 'validating' | 'success' | 'error';

const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: theme.colors.difficultyEasy,
  medium: theme.colors.difficultyMedium,
  hard: theme.colors.difficultyHard,
};

// ─── Barre de progression (petits rectangles) ─────────────────────────────────

function StepProgressBar({ steps }: { steps: StepDetail[] }) {
  return (
    <View style={styles.progressBar}>
      {steps.map((s) => (
        <View
          key={s.id}
          style={[
            styles.progressRect,
            s.status === 'completed' && styles.progressRectDone,
            s.status === 'current' && styles.progressRectCurrent,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Grille des étapes (3 par ligne, bord pointillé autour) ───────────────────

type GridStep = {
  id: string;
  order: number;
  status: StepStatus | 'locked';
  thumbnail?: string | null;
};

function StepGrid({ steps, currentStepId }: { steps: GridStep[]; currentStepId?: string }) {
  return (
    <View style={styles.gridWrapper}>
      <View style={styles.grid}>
        {steps.map((s) => {
          const isDone = s.status === 'completed';
          const isCurrent = s.status === 'current';
          const thumb = s.thumbnail ?? null;
          return (
            <View
              key={s.id}
              style={[
                styles.gridSquare,
                isDone && styles.gridSquareDone,
                isCurrent && styles.gridSquareCurrent,
              ]}
            >
              {thumb ? (
                <>
                  <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  {isDone && (
                    <View style={styles.gridThumbOverlay}>
                      <Ionicons name="checkmark-circle" size={30} color="#fff" />
                    </View>
                  )}
                  {!isDone && isCurrent && (
                    <View style={styles.gridThumbBadge}>
                      <Text style={styles.gridThumbBadgeText}>En cours</Text>
                    </View>
                  )}
                </>
              ) : isDone ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.success} />
              ) : (
                <Text style={[styles.gridSquareText, isCurrent && styles.gridSquareTextCurrent]}>
                  {s.order}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Section caméra ───────────────────────────────────────────────────────────
// La logique QR est internalisée ici pour éviter les stale closures côté parent.

interface CameraSectionProps {
  huntId: string;
  currentStep: StepDetail | null;
  onValidated: (p: HuntProgress) => Promise<void>;
  onError: (err: unknown) => void;
  setValidationState: (s: ValidationState) => void;
  validationState: ValidationState;
}

function CameraSection({ huntId, currentStep, onValidated, onError, setValidationState, validationState }: CameraSectionProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isQr = currentStep?.validation_type === 'qrcode';

  // Réinitialise le scan quand l'étape change
  useEffect(() => { setScanned(false); }, [currentStep?.id]);

  const handleScan = async (result: BarcodeScanningResult) => {
    if (!currentStep || scanned || validationState === 'validating') return;
    setScanned(true);
    setValidationState('validating');
    try {
      const p = await huntService.validateStep(huntId, currentStep.id, { qr_code: result.data });
      await onValidated(p);
    } catch (err) {
      onError(err);
      setScanned(false);
    }
  };

  if (!permission) {
    return <View style={styles.cameraBox}><ActivityIndicator color={theme.colors.primary} /></View>;
  }
  if (!permission.granted) {
    return (
      <TouchableOpacity style={styles.cameraBox} onPress={requestPermission} activeOpacity={0.8}>
        <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.7)" />
        <Text style={styles.cameraPermText}>Autoriser la caméra</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.cameraBox}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={isQr && !scanned ? handleScan : undefined}
        barcodeScannerSettings={isQr ? { barcodeTypes: ['qr'] } : undefined}
      />
      <View style={styles.cameraOverlay}>
        <View style={styles.cameraFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Text style={styles.cameraFrameLabel}>
            {isQr ? 'Scannez le QR code' : 'Cadrez l\'œuvre'}
          </Text>
        </View>
      </View>
      {validationState === 'validating' && (
        <View style={styles.cameraValidating}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.cameraValidatingText}>Validation…</Text>
        </View>
      )}
      {!currentStep && (
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraInactiveOverlay}>
            <Ionicons name="scan-outline" size={36} color="rgba(255,255,255,0.6)" />
            <Text style={styles.cameraInactiveText}>Rejoignez la chasse pour activer le scan</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── HuntDetailScreen ─────────────────────────────────────────────────────────

export default function HuntDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { huntId } = route.params;
  const queryClient = useQueryClient();

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const { data: hunt, isLoading: huntLoading, isError: huntError } = useHuntDetail(huntId);
  const { data: progress, isLoading: progressLoading } = useHuntProgress(huntId);
  const isLoading = huntLoading || progressLoading;

  const currentStep = progress?.steps.find((s) => s.status === 'current') ?? null;
  const completedCount = progress?.steps.filter((s) => s.status === 'completed').length ?? 0;

  // Dernière position GPS pour estimation de distance
  useEffect(() => {
    if (currentStep?.validation_type !== 'gps') return;
    Location.getLastKnownPositionAsync().then((loc) => {
      if (loc) setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    });
  }, [currentStep?.id]);

  // Réinitialise l'état de validation quand l'étape change
  useEffect(() => {
    setValidationState('idle');
    setErrorMsg(null);
    setAnswer('');
  }, [currentStep?.id]);

  // ── Validation commune ─────────────────────────────────────────────────────

  const extractMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';

  const onValidated = async (p: HuntProgress) => {
    setValidationState('success');
    await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
    setTimeout(() => {
      if (p.completed_at) {
        navigation.replace('HuntCompletion', {
          huntId,
          totalPoints: p.total_points,
          stepCount: steps.length,
          startedAt: p.started_at,
          completedAt: p.completed_at,
        });
      } else {
        setValidationState('idle');
      }
    }, 1200);
  };

  const onError = (err: unknown) => {
    const msg = extractMsg(err);
    setValidationState('error');
    setErrorMsg(msg || 'Une erreur est survenue. Réessayez.');
  };

  // ── Validation GPS ─────────────────────────────────────────────────────────

  const handleGpsValidate = async () => {
    if (!currentStep) return;
    setValidationState('locating');
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setValidationState('error');
        setErrorMsg('Permission GPS refusée.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserPos(pos);
      setValidationState('validating');
      const p = await huntService.validateStep(huntId, currentStep.id, pos);
      await onValidated(p);
    } catch (err) {
      onError(err);
    }
  };

  // ── Validation Quiz ────────────────────────────────────────────────────────

  const handleQuizSubmit = async () => {
    if (!currentStep || !answer.trim()) return;
    Keyboard.dismiss();
    setValidationState('validating');
    setErrorMsg(null);
    try {
      const p = await huntService.validateStep(huntId, currentStep.id, { answer: answer.trim() });
      await onValidated(p);
    } catch (err) {
      onError(err);
    }
  };

  // ── Validation AR ─────────────────────────────────────────────────────────

  const handleArConfirm = async (qrCode?: string) => {
    if (!currentStep) return;
    setValidationState('validating');
    setErrorMsg(null);
    try {
      let payload: Record<string, unknown> = {};
      if (currentStep.validation_type === 'ar' && !qrCode) {
        payload = { marker_triggered: true };
      } else if (qrCode) {
        payload = { qr_code: qrCode };
      }
      const p = await huntService.validateStep(huntId, currentStep.id, payload);
      await onValidated(p);
    } catch (err) {
      onError(err);
    }
  };

  // ── Rejoindre ──────────────────────────────────────────────────────────────

  const handleJoin = async () => {
    setJoining(true);
    setJoinError(null);
    try {
      await huntService.joinHunt(huntId);
      await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
    } catch {
      setJoinError('Impossible de rejoindre la chasse. Réessayez.');
    } finally {
      setJoining(false);
    }
  };

  // ── États ──────────────────────────────────────────────────────────────────

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

  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? theme.colors.textSecondary;
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty ?? '—';
  const steps = progress?.steps ?? [];

  // ── Instruction selon le type ──────────────────────────────────────────────

  const instructionText = (() => {
    if (!currentStep) return null;
    switch (currentStep.validation_type) {
      case 'qrcode': return 'Scannez le QR code présent sur l\'œuvre pour valider cette étape.';
      case 'photo':  return 'Cadrez l\'œuvre devant vous, puis prenez la photo pour valider.';
      case 'quiz':   return 'Répondez à la question pour valider cette étape.';
      default:       return 'Approchez-vous de l\'emplacement et validez votre position GPS.';
    }
  })();

  // ── Bouton valider ─────────────────────────────────────────────────────────

  const isSubmitting = validationState === 'validating' || validationState === 'locating';
  const isSuccess = validationState === 'success';

  const handleValidate = () => {
    if (!currentStep) return;
    if (currentStep.validation_type === 'gps') handleGpsValidate();
    else if (currentStep.validation_type === 'quiz') handleQuizSubmit();
    else if (currentStep.validation_type === 'qrcode') {
      setValidationState('idle');
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={currentStep?.validation_type !== 'qrcode' || validationState !== 'idle'}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Bannière violette ── */}
      <View style={styles.header}>
        {/* Barre de petits rectangles */}
        {steps.length > 0 && <StepProgressBar steps={steps} />}

        {/* Badge difficulté */}
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '33' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>{hunt.title}</Text>

        {/* Étape actuelle + points */}
        {progress && currentStep && (
          <View style={styles.stepMeta}>
            <Text style={styles.stepMetaText}>
              Étape {currentStep.order} sur {steps.length}
            </Text>
            <View style={styles.stepMetaDot} />
            <Ionicons name="star" size={13} color={theme.colors.points} />
            <Text style={styles.stepMetaText}>{hunt.points} points</Text>
          </View>
        )}

        {/* Terminée */}
        {progress?.completed_at && (
          <View style={styles.completedPill}>
            <Ionicons name="trophy" size={14} color={theme.colors.success} />
            <Text style={styles.completedPillText}>Chasse terminée !</Text>
          </View>
        )}
      </View>

      {/* ── Vue caméra — toujours visible ── */}
      {!progress?.completed_at && (
        currentStep?.validation_type === 'gps' ? (
          <View style={styles.gpsBox}>
            <Ionicons name="navigate-circle" size={48} color={theme.colors.primary} />
            {userPos && currentStep.coordinates ? (
              <Text style={styles.gpsDistance}>
                {formatDistance(haversineDistance(
                  userPos.lat, userPos.lng,
                  currentStep.coordinates.lat, currentStep.coordinates.lng,
                ))}
              </Text>
            ) : null}
            <Text style={styles.gpsLabel}>
              {userPos && currentStep.coordinates
                ? `Rayon : ${currentStep.validation_radius} m`
                : 'Approchez-vous de l\'étape'}
            </Text>
          </View>
        ) : currentStep?.validation_type === 'ar' && currentStep.ar_content ? (
          /* AR ViroReact — marqueur image + contenu 3D */
          <View style={styles.arWrapper}>
            <ARSection
              arContent={currentStep.ar_content as ArContent}
              onConfirm={handleArConfirm}
              validating={validationState === 'validating'}
              errorMsg={errorMsg}
            />
          </View>
        ) : (
          /* Caméra QR/Photo — key force le remontage au changement d'étape */
          <CameraSection
            key={currentStep?.id ?? 'no-step'}
            huntId={huntId}
            currentStep={currentStep}
            validationState={validationState}
            setValidationState={setValidationState}
            onValidated={onValidated}
            onError={onError}
          />
        )
      )}

      {/* ── Instruction ── */}
      {instructionText && !progress?.completed_at && (
        <Text style={styles.instruction}>{instructionText}</Text>
      )}

      {/* ── Erreur / Succès ── */}
      {validationState === 'error' && errorMsg && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      )}
      {isSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
          <Text style={styles.successBannerText}>Étape validée ! Bravo !</Text>
        </View>
      )}

      {/* ── Réponse Quiz ── */}
      {progress && currentStep?.validation_type === 'quiz' && !isSuccess && (
        <TextInput
          style={styles.quizInput}
          placeholder="Votre réponse…"
          placeholderTextColor={theme.colors.textDisabled}
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleQuizSubmit}
          editable={!isSubmitting}
        />
      )}

      {/* ── Grille des étapes ── */}
      {steps.length > 0 && (
        <StepGrid steps={steps} currentStepId={currentStep?.id} />
      )}

      {/* ── Sans progress : aperçu grille + Rejoindre ── */}
      {!progress && (
        <>
          <StepGrid
            steps={hunt.steps.map((s) => ({ ...s, status: 'locked' as const }))}
          />
          <View style={styles.joinSection}>
            {joinError && <Text style={styles.joinError}>{joinError}</Text>}
            <TouchableOpacity
              style={[styles.validateBtn, joining && styles.btnDisabled]}
              onPress={handleJoin}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining
                ? <ActivityIndicator color={theme.colors.textInverse} size="small" />
                : <Text style={styles.validateBtnText}>Rejoindre la chasse</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Bouton valider l'étape ── */}
      {progress && currentStep && !progress.completed_at && !isSuccess && (
        <TouchableOpacity
          style={[styles.validateBtn, isSubmitting && styles.btnDisabled]}
          onPress={handleValidate}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator color={theme.colors.textInverse} size="small" />
            : <Text style={styles.validateBtnText}>
                {currentStep.validation_type === 'qrcode' ? 'Scanner à nouveau' : 'Valider la réponse'}
              </Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER = 20;
const CW = 3;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.surfaceElevated },
  errorText: { ...theme.typography.body, color: theme.colors.textSecondary },
  container: { flex: 1, backgroundColor: theme.colors.surfaceElevated },
  content: { paddingBottom: theme.spacing.xxl },

  // ── Header violet ──
  header: {
    backgroundColor: theme.colors.gradientStart,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  progressRect: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressRectDone: { backgroundColor: theme.colors.success },
  progressRectCurrent: { backgroundColor: theme.colors.primary },

  diffBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  diffText: { ...theme.typography.caption, fontWeight: '600' },
  title: { ...theme.typography.h2, color: theme.colors.textInverse, paddingHorizontal: theme.spacing.lg, lineHeight: 30 },

  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  stepMetaText: { ...theme.typography.bodySmall, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  stepMetaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },

  completedPill: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    alignSelf: 'flex-start', marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md,
  },
  completedPillText: { ...theme.typography.caption, color: theme.colors.success, fontWeight: '700' },

  // ── Caméra ──
  cameraBox: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    height: 220,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arWrapper: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cameraPermText: { ...theme.typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: theme.spacing.sm },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  cameraFrame: { width: 180, height: 140, position: 'relative', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: theme.spacing.sm },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW },
  cornerTR: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW },
  cameraFrameLabel: {
    ...theme.typography.caption, color: '#fff', fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: theme.spacing.sm, paddingVertical: 3,
    borderRadius: theme.borderRadius.sm, overflow: 'hidden',
  },
  cameraValidating: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', gap: theme.spacing.sm },
  cameraValidatingText: { ...theme.typography.bodySmall, color: '#fff' },
  cameraInactiveOverlay: { justifyContent: 'center', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg },
  cameraInactiveText: { ...theme.typography.caption, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },

  // ── GPS ──
  gpsBox: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    height: 140,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
    gap: theme.spacing.xs,
    ...theme.shadows.card,
  },
  gpsDistance: { ...theme.typography.h2, color: theme.colors.primary },
  gpsLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },

  // ── Instruction ──
  instruction: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },

  // ── Banners ──
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md, marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.error + '44',
  },
  errorBannerText: { ...theme.typography.caption, color: theme.colors.error, flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md, marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.success + '44',
  },
  successBannerText: { ...theme.typography.label, color: theme.colors.success },

  // ── Quiz ──
  quizInput: {
    ...theme.typography.body,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
  },

  // ── Grille étapes (pointillés) ──
  gridWrapper: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.textSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  gridSquare: {
    width: 104,
    height: 104,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1, borderColor: theme.colors.border,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  gridSquareDone: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success + '66',
  },
  gridSquareCurrent: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  gridSquareText: { ...theme.typography.h3, color: theme.colors.textSecondary, fontSize: 18 },
  gridSquareTextCurrent: { color: theme.colors.primary },
  gridThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  gridThumbBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(99,102,241,0.85)',
    paddingVertical: 3, alignItems: 'center',
  },
  gridThumbBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // ── Rejoindre / Valider ──
  joinSection: { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, gap: theme.spacing.sm },
  joinError: { ...theme.typography.caption, color: theme.colors.error, textAlign: 'center' },
  validateBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: theme.spacing.md, marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.elevated,
  },
  validateBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
