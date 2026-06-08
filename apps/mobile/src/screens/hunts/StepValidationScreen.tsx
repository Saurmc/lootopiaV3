import React, { useEffect, useRef, useState } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import { huntService, haversineDistance, formatDistance } from '../../services/hunt.service';
import type { HuntProgress } from '../../services/hunt.service';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import ARSection from '../../components/step/ARSection';
import type { ArContent } from '../../components/step/ARSection';
import { useTranslation } from 'react-i18next';

type RouteProps = RouteProp<AppStackParamList, 'StepValidation'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'StepValidation'>;

type ValidationState = 'idle' | 'locating' | 'validating' | 'success' | 'error_range' | 'error_other';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return typeof msg === 'string' ? msg : '';
}

// ─── Section GPS ──────────────────────────────────────────────────────────────

interface GpsSectionProps {
  coordinates: { lat: number; lng: number } | null;
  validationRadius: number;
  userPos: { lat: number; lng: number } | null;
  state: ValidationState;
  errorMsg: string | null;
  onValidate: () => void;
  pulseAnim: Animated.Value;
}

function GpsSection({
  coordinates,
  validationRadius,
  userPos,
  state,
  errorMsg,
  onValidate,
  pulseAnim,
}: GpsSectionProps) {
  const { t } = useTranslation();
  const distance =
    userPos && coordinates
      ? haversineDistance(userPos.lat, userPos.lng, coordinates.lat, coordinates.lng)
      : null;

  const isClose = distance !== null && distance <= validationRadius;
  const isLoading = state === 'locating' || state === 'validating';

  return (
    <>
      {/* Rayon */}
      <View style={styles.radiusChip}>
        <Text style={styles.radiusChipText}>{t('stepValidation.gps.radiusLabel', { value: validationRadius })}</Text>
      </View>

      {/* Indicateur distance */}
      {coordinates ? (
        <View style={[
          styles.distanceCard,
          isClose ? styles.distanceCardClose : (distance !== null ? styles.distanceCardFar : styles.distanceCardUnknown),
        ]}>
          <Animated.Text style={[styles.distanceIcon, { transform: [{ scale: pulseAnim }] }]}>
            {isClose ? '✅' : (distance !== null ? '📍' : '📡')}
          </Animated.Text>
          <View style={styles.distanceInfo}>
            {distance !== null ? (
              <>
                <Text style={[styles.distanceValue, isClose ? styles.distanceValueClose : styles.distanceValueFar]}>
                  {formatDistance(distance)}
                </Text>
                <Text style={styles.distanceSubtext}>
                  {isClose
                    ? t('stepValidation.gps.inZone')
                    : t('stepValidation.gps.remaining', { dist: formatDistance(Math.max(0, distance - validationRadius)) })}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.distanceValue}>{t('stepValidation.gps.unknownPos')}</Text>
                <Text style={styles.distanceSubtext}>{t('stepValidation.gps.pressToValidate')}</Text>
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.distanceCard}>
          <Text style={styles.distanceIcon}>🗺</Text>
          <Text style={styles.distanceSubtext}>{t('stepValidation.gps.noCoordinates')}</Text>
        </View>
      )}

      {/* Spinner */}
      {(state === 'locating' || state === 'validating') && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {state === 'locating' ? t('stepValidation.gps.locating') : t('stepValidation.gps.validating')}
          </Text>
        </View>
      )}

      {/* Erreur */}
      {(state === 'error_range' || state === 'error_other') && errorMsg && (
        <ErrorBanner type={state === 'error_range' ? 'range' : 'other'} message={errorMsg} />
      )}

      {/* Bouton */}
      {state !== 'success' && (
        <TouchableOpacity
          style={[styles.validateBtn, isLoading && styles.validateBtnDisabled]}
          onPress={onValidate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.validateBtnIcon}>📡</Text>
              <Text style={styles.validateBtnLabel}>{t('stepValidation.gps.validateBtn')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {state === 'idle' && (
        <Text style={styles.hint}>{t('stepValidation.gps.hint')}</Text>
      )}
    </>
  );
}

// ─── Section QR Code ──────────────────────────────────────────────────────────

interface QrSectionProps {
  state: ValidationState;
  errorMsg: string | null;
  onScanned: (result: BarcodeScanningResult) => void;
  onRetry: () => void;
  scanned: boolean;
}

function QrSection({ state, errorMsg, onScanned, onRetry, scanned }: QrSectionProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.cameraPlaceholder}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>{t('stepValidation.camera.title')}</Text>
        <Text style={styles.permissionText}>{t('stepValidation.qr.cameraDesc')}</Text>
        <TouchableOpacity style={styles.validateBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.validateBtnLabel}>{t('stepValidation.camera.authorize')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Viewfinder */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : onScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        {/* Cadre de scan */}
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        {/* Label */}
        <View style={styles.cameraLabel}>
          <Text style={styles.cameraLabelText}>
            {state === 'validating' ? t('stepValidation.validating') : t('stepValidation.qr.pointQr')}
          </Text>
        </View>
      </View>

      {/* Spinner validation */}
      {state === 'validating' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>{t('stepValidation.qr.checking')}</Text>
        </View>
      )}

      {/* Erreur */}
      {(state === 'error_range' || state === 'error_other') && errorMsg && (
        <>
          <ErrorBanner type="other" message={errorMsg} />
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryBtnLabel}>{t('stepValidation.retry')}</Text>
          </TouchableOpacity>
        </>
      )}

      {state === 'idle' && (
        <Text style={styles.hint}>{t('stepValidation.qr.hint')}</Text>
      )}
    </>
  );
}

// ─── Section Photo ────────────────────────────────────────────────────────────

interface PhotoSectionProps {
  state: ValidationState;
  errorMsg: string | null;
  onSubmit: (uri: string) => void;
}

function PhotoSection({ state, errorMsg, onSubmit }: PhotoSectionProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);

  const handleTakePicture = async () => {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedUri(pic.uri);
    } catch {
      // ignore rare native errors
    } finally {
      setTaking(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.cameraPlaceholder}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>{t('stepValidation.camera.title')}</Text>
        <Text style={styles.permissionText}>{t('stepValidation.photo.cameraDesc')}</Text>
        <TouchableOpacity style={styles.validateBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.validateBtnLabel}>{t('stepValidation.camera.authorize')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Aperçu de la photo prise ── */
  if (capturedUri) {
    const isValidating = state === 'validating';
    return (
      <>
        <Image source={{ uri: capturedUri }} style={styles.photoPreview} resizeMode="cover" />

        {errorMsg && <ErrorBanner type="other" message={errorMsg} />}

        <TouchableOpacity
          style={[styles.validateBtn, isValidating && styles.validateBtnDisabled]}
          onPress={() => onSubmit(capturedUri)}
          disabled={isValidating}
          activeOpacity={0.8}
        >
          {isValidating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.validateBtnIcon}>✔️</Text>
              <Text style={styles.validateBtnLabel}>{t('stepValidation.photo.usePhoto')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.retryBtn, isValidating && styles.validateBtnDisabled]}
          onPress={() => setCapturedUri(null)}
          disabled={isValidating}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnLabel}>{t('stepValidation.photo.retake')}</Text>
        </TouchableOpacity>
      </>
    );
  }

  /* ── Viewfinder ── */
  return (
    <>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        {/* Viseur centré */}
        <View style={styles.scannerOverlay}>
          <View style={[styles.scannerFrame, { width: 240, height: 180 }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.validateBtn, taking && styles.validateBtnDisabled]}
        onPress={handleTakePicture}
        disabled={taking}
        activeOpacity={0.8}
      >
        {taking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.validateBtnIcon}>📷</Text>
            <Text style={styles.validateBtnLabel}>{t('stepValidation.photo.takePhoto')}</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>{t('stepValidation.photo.hint')}</Text>
    </>
  );
}

// ─── Section Quiz ─────────────────────────────────────────────────────────────

interface QuizSectionProps {
  state: ValidationState;
  errorMsg: string | null;
  answer: string;
  onChangeAnswer: (v: string) => void;
  onSubmit: () => void;
}

function QuizSection({ state, errorMsg, answer, onChangeAnswer, onSubmit }: QuizSectionProps) {
  const { t } = useTranslation();
  const isLoading = state === 'validating';
  const hasError = state === 'error_other' && errorMsg !== null;

  return (
    <>
      {/* Zone de réponse */}
      <View style={styles.quizInputWrapper}>
        <Text style={styles.quizInputLabel}>{t('stepValidation.quiz.answerLabel')}</Text>
        <TextInput
          style={[styles.quizInput, hasError && styles.quizInputError]}
          placeholder={t('stepValidation.quiz.answerPlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={answer}
          onChangeText={onChangeAnswer}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          editable={!isLoading}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Spinner */}
      {isLoading && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>{t('stepValidation.quiz.checking')}</Text>
        </View>
      )}

      {/* Erreur */}
      {hasError && errorMsg && (
        <ErrorBanner type="other" message={errorMsg} />
      )}

      {/* Bouton */}
      <TouchableOpacity
        style={[styles.validateBtn, (isLoading || !answer.trim()) && styles.validateBtnDisabled]}
        onPress={onSubmit}
        disabled={isLoading || !answer.trim()}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.validateBtnIcon}>✔️</Text>
            <Text style={styles.validateBtnLabel}>{t('stepValidation.quiz.validateBtn')}</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>{t('stepValidation.quiz.hint')}</Text>
    </>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

function ErrorBanner({ type, message }: { type: 'range' | 'other'; message: string }) {
  return (
    <View style={[styles.errorBanner, type === 'range' ? styles.errorBannerRange : styles.errorBannerOther]}>
      <Text style={styles.errorBannerIcon}>{type === 'range' ? '📍' : '⚠️'}</Text>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

// ─── StepValidationScreen ────────────────────────────────────────────────────

/**
 * StepValidationScreen — valide l'étape courante d'une chasse.
 * Supporte deux modes selon `validationType` :
 * - "gps"    : obtient la position → POST { lat, lng }
 * - "qrcode" : scanner caméra     → POST { qr_code }
 */
export default function StepValidationScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();

  const {
    huntId,
    stepId,
    stepTitle,
    stepDescription,
    validationType,
    validationRadius,
    coordinates,
    arContent,
  } = route.params;

  const [state, setState] = useState<ValidationState>('idle');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [answer, setAnswer] = useState('');

  // Pulse animation pour l'icône GPS
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Dernière position connue pour l'estimation de distance (mode GPS)
  useEffect(() => {
    if (validationType !== 'gps') return;
    Location.getLastKnownPositionAsync().then((loc) => {
      if (loc) setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    });
  }, [validationType]);

  // ── Fin de validation (partagée) ─────────────────────────────────────────────

  const onValidated = async (progress: HuntProgress) => {
    setState('success');
    await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
    setTimeout(() => {
      if (progress.completed_at) {
        navigation.replace('HuntCompletion', {
          huntId,
          totalPoints: progress.total_points,
          stepCount: progress.completed_steps?.length ?? 0,
          startedAt: progress.started_at,
          completedAt: progress.completed_at,
        });
      } else {
        navigation.goBack();
      }
    }, 1500);
  };

  const onError = (err: unknown, isRangeError: boolean) => {
    const msg = extractErrorMessage(err);
    if (isRangeError) {
      setState('error_range');
      setErrorMsg(t('stepValidation.gps.tooFar'));
    } else {
      setState('error_other');
      setErrorMsg(msg || t('stepValidation.genericError'));
    }
  };

  // ── Validation GPS ────────────────────────────────────────────────────────────

  const handleGpsValidate = async () => {
    setState('locating');
    setErrorMsg(null);

    let pos: { lat: number; lng: number };
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('error_other');
        setErrorMsg(t('stepValidation.gps.permissionDenied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserPos(pos);
    } catch {
      setState('error_other');
      setErrorMsg(t('stepValidation.gps.getPositionError'));
      return;
    }

    setState('validating');
    try {
      const progress = await huntService.validateStep(huntId, stepId, pos);
      await onValidated(progress);
    } catch (err) {
      const msg = extractErrorMessage(err);
      onError(err, msg.toLowerCase().includes('radius'));
    }
  };

  // ── Validation QR ─────────────────────────────────────────────────────────────

  const handleQrScanned = async (result: BarcodeScanningResult) => {
    if (scanned || state === 'validating' || state === 'success') return;
    setScanned(true);
    setState('validating');
    setErrorMsg(null);
    try {
      const progress = await huntService.validateStep(huntId, stepId, { qr_code: result.data });
      await onValidated(progress);
    } catch (err) {
      onError(err, false);
    }
  };

  const handleQrRetry = () => {
    setScanned(false);
    setState('idle');
    setErrorMsg(null);
  };

  // ── Validation Photo ──────────────────────────────────────────────────────────

  const handlePhotoSubmit = async (uri: string) => {
    setState('validating');
    setErrorMsg(null);
    try {
      const progress = await huntService.validateStep(huntId, stepId, { file_url: uri });
      await onValidated(progress);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setState('error_other');
      setErrorMsg(msg || t('stepValidation.photo.validateError'));
    }
  };

  // ── Validation AR ────────────────────────────────────────────────────────────

  const handleArConfirm = async (qrCode?: string) => {
    setState('validating');
    setErrorMsg(null);
    try {
      let payload: Record<string, unknown> = {};
      if ((arContent as { type?: string } | null)?.type === 'ar-3d-spatial') {
        payload = { marker_triggered: true };
      } else if (qrCode) {
        payload = { qr_code: qrCode };
      }
      const progress = await huntService.validateStep(huntId, stepId, payload);
      await onValidated(progress);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setState('error_other');
      setErrorMsg(
        msg.toLowerCase().includes('qr')
          ? t('stepValidation.ar.wrongQr')
          : (msg || t('stepValidation.genericError')),
      );
    }
  };

  // ── Validation Quiz ───────────────────────────────────────────────────────────

  const handleQuizSubmit = async () => {
    if (!answer.trim()) return;
    Keyboard.dismiss();
    setState('validating');
    setErrorMsg(null);
    try {
      const progress = await huntService.validateStep(huntId, stepId, { answer: answer.trim() });
      await onValidated(progress);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setState('error_other');
      setErrorMsg(
        msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('answer')
          ? t('stepValidation.quiz.wrongAnswer')
          : (msg || t('stepValidation.genericError')),
      );
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      // Désactive le scroll pendant le scan pour ne pas perdre le viewfinder
      scrollEnabled={validationType !== 'qrcode' || state !== 'idle'}
    >
      {/* En-tête étape */}
      <View style={styles.stepCard}>
        <Text style={styles.stepLabel}>{t('stepValidation.stepInProgress')}</Text>
        <Text style={styles.stepTitle}>{stepTitle}</Text>
        {stepDescription ? <Text style={styles.stepDesc}>{stepDescription}</Text> : null}
      </View>

      {/* Badge type de validation */}
      <View style={styles.typeChip}>
        <Text style={styles.typeChipText}>
          {validationType === 'qrcode'
            ? t('stepValidation.type.qrcode')
            : validationType === 'quiz'
            ? t('stepValidation.type.quiz')
            : validationType === 'photo'
            ? t('stepValidation.type.photo')
            : validationType === 'ar'
            ? t('stepValidation.type.ar')
            : t('stepValidation.type.gps')}
        </Text>
      </View>

      {/* Succès */}
      {state === 'success' && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>{t('stepValidation.success')}</Text>
        </View>
      )}

      {/* Section spécifique au type */}
      {state !== 'success' && (
        validationType === 'qrcode' ? (
          <QrSection
            state={state}
            errorMsg={errorMsg}
            onScanned={handleQrScanned}
            onRetry={handleQrRetry}
            scanned={scanned}
          />
        ) : validationType === 'quiz' ? (
          <QuizSection
            state={state}
            errorMsg={errorMsg}
            answer={answer}
            onChangeAnswer={setAnswer}
            onSubmit={handleQuizSubmit}
          />
        ) : validationType === 'photo' ? (
          <PhotoSection
            state={state}
            errorMsg={errorMsg}
            onSubmit={handlePhotoSubmit}
          />
        ) : validationType === 'ar' && arContent ? (
          <ARSection
            arContent={arContent as ArContent}
            onConfirm={handleArConfirm}
            validating={state === 'validating'}
            errorMsg={errorMsg}
          />
        ) : (
          <GpsSection
            coordinates={coordinates}
            validationRadius={validationRadius}
            userPos={userPos}
            state={state}
            errorMsg={errorMsg}
            onValidate={handleGpsValidate}
            pulseAnim={pulseAnim}
          />
        )
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER_SIZE = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  // Étape
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  stepDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  // Badge type
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  typeChipText: { fontSize: 13, color: '#1D4ED8', fontWeight: '500' },

  // GPS
  radiusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  radiusChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 14,
  },
  distanceCardClose: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  distanceCardFar: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  distanceCardUnknown: { borderColor: '#E5E7EB' },
  distanceIcon: { fontSize: 32 },
  distanceInfo: { flex: 1, gap: 3 },
  distanceValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  distanceValueClose: { color: '#15803D' },
  distanceValueFar: { color: '#C2410C' },
  distanceSubtext: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  // QR
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  permissionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  permissionIcon: { fontSize: 40 },
  permissionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  permissionText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cameraLabel: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Statuts partagés
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  statusText: { fontSize: 14, color: '#3B82F6' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    justifyContent: 'center',
  },
  successIcon: { fontSize: 28 },
  successText: { fontSize: 16, fontWeight: '700', color: '#15803D' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  errorBannerRange: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  errorBannerOther: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  errorBannerIcon: { fontSize: 20 },
  errorBannerText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // Boutons
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  validateBtnDisabled: { opacity: 0.6 },
  validateBtnIcon: { fontSize: 18 },
  validateBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  retryBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  retryBtnLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },

  // Photo
  photoPreview: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    backgroundColor: '#000',
  },

  // Quiz
  quizInputWrapper: {
    gap: 6,
  },
  quizInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  quizInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  quizInputError: {
    borderColor: '#EF4444',
  },
});
