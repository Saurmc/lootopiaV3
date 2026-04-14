import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import type { AppStackParamList } from '../../navigation/AppNavigator';

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
        <Text style={styles.radiusChipText}>📏 Rayon de validation : {validationRadius} m</Text>
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
                    ? 'Vous êtes dans la zone de validation !'
                    : `Il vous reste ${formatDistance(Math.max(0, distance - validationRadius))} à parcourir`}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.distanceValue}>Position inconnue</Text>
                <Text style={styles.distanceSubtext}>Appuyez sur "Valider" pour obtenir votre position</Text>
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.distanceCard}>
          <Text style={styles.distanceIcon}>🗺</Text>
          <Text style={styles.distanceSubtext}>
            Les coordonnées de destination ne sont pas disponibles.{'\n'}
            Approchez-vous de l'emplacement indiqué et validez.
          </Text>
        </View>
      )}

      {/* Spinner */}
      {(state === 'locating' || state === 'validating') && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {state === 'locating' ? 'Obtention de votre position GPS…' : 'Validation en cours…'}
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
              <Text style={styles.validateBtnLabel}>Valider ma position GPS</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {state === 'idle' && (
        <Text style={styles.hint}>
          Rendez-vous à l'emplacement de l'étape, puis appuyez sur le bouton pour valider votre présence.
        </Text>
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
        <Text style={styles.permissionTitle}>Accès caméra requis</Text>
        <Text style={styles.permissionText}>
          Pour scanner le QR code de cette étape, autorisez l'accès à votre caméra.
        </Text>
        <TouchableOpacity style={styles.validateBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.validateBtnLabel}>Autoriser la caméra</Text>
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
            {state === 'validating' ? 'Validation…' : 'Pointez vers le QR code'}
          </Text>
        </View>
      </View>

      {/* Spinner validation */}
      {state === 'validating' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>Vérification du QR code…</Text>
        </View>
      )}

      {/* Erreur */}
      {(state === 'error_range' || state === 'error_other') && errorMsg && (
        <>
          <ErrorBanner type="other" message={errorMsg} />
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryBtnLabel}>🔄 Réessayer</Text>
          </TouchableOpacity>
        </>
      )}

      {state === 'idle' && (
        <Text style={styles.hint}>
          Scannez le QR code présent à l'emplacement de l'étape pour valider votre présence.
        </Text>
      )}
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
  const isLoading = state === 'validating';
  const hasError = state === 'error_other' && errorMsg !== null;

  return (
    <>
      {/* Zone de réponse */}
      <View style={styles.quizInputWrapper}>
        <Text style={styles.quizInputLabel}>Votre réponse</Text>
        <TextInput
          style={[styles.quizInput, hasError && styles.quizInputError]}
          placeholder="Saisissez votre réponse…"
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
          <Text style={styles.statusText}>Vérification de la réponse…</Text>
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
            <Text style={styles.validateBtnLabel}>Valider ma réponse</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        La réponse n'est pas sensible à la casse ni aux espaces superflus.
      </Text>
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

  const onSuccess = async () => {
    setState('success');
    await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
    setTimeout(() => navigation.goBack(), 1500);
  };

  const onError = (err: unknown, isRangeError: boolean) => {
    const msg = extractErrorMessage(err);
    if (isRangeError) {
      setState('error_range');
      setErrorMsg('Vous n\'êtes pas assez proche de la destination. Rapprochez-vous et réessayez.');
    } else {
      setState('error_other');
      setErrorMsg(msg || 'Une erreur est survenue. Réessayez.');
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
        setErrorMsg('Permission GPS refusée. Autorisez l\'accès à votre position dans les réglages.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserPos(pos);
    } catch {
      setState('error_other');
      setErrorMsg('Impossible d\'obtenir votre position GPS. Réessayez.');
      return;
    }

    setState('validating');
    try {
      await huntService.validateStep(huntId, stepId, pos);
      await onSuccess();
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
      await huntService.validateStep(huntId, stepId, { qr_code: result.data });
      await onSuccess();
    } catch (err) {
      onError(err, false);
    }
  };

  const handleQrRetry = () => {
    setScanned(false);
    setState('idle');
    setErrorMsg(null);
  };

  // ── Validation Quiz ───────────────────────────────────────────────────────────

  const handleQuizSubmit = async () => {
    if (!answer.trim()) return;
    Keyboard.dismiss();
    setState('validating');
    setErrorMsg(null);
    try {
      await huntService.validateStep(huntId, stepId, { answer: answer.trim() });
      await onSuccess();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setState('error_other');
      setErrorMsg(
        msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('answer')
          ? 'Mauvaise réponse. Réessayez !'
          : (msg || 'Une erreur est survenue. Réessayez.'),
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
        <Text style={styles.stepLabel}>Étape en cours</Text>
        <Text style={styles.stepTitle}>{stepTitle}</Text>
        {stepDescription ? <Text style={styles.stepDesc}>{stepDescription}</Text> : null}
      </View>

      {/* Badge type de validation */}
      <View style={styles.typeChip}>
        <Text style={styles.typeChipText}>
          {validationType === 'qrcode'
            ? '📱 Validation par QR code'
            : validationType === 'quiz'
            ? '❓ Validation par quiz'
            : '📡 Validation par GPS'}
        </Text>
      </View>

      {/* Succès */}
      {state === 'success' && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>Étape validée ! Bravo !</Text>
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
