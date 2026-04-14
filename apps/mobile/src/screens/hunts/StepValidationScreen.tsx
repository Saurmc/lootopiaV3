import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { huntService, haversineDistance, formatDistance } from '../../services/hunt.service';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type RouteProps = RouteProp<AppStackParamList, 'StepValidation'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'StepValidation'>;

type ValidationState = 'idle' | 'locating' | 'validating' | 'success' | 'error_range' | 'error_other';

/**
 * StepValidationScreen — validation GPS d'une étape.
 * 1. Obtient la position GPS courante (expo-location)
 * 2. Affiche la distance à la cible et l'état (trop loin / assez proche)
 * 3. POST /hunts/:id/steps/:stepId/validate { lat, lng }
 * 4. Succès → invalide le cache de progression → retour à HuntDetail
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
    validationRadius,
    coordinates,
  } = route.params;

  const [state, setState] = useState<ValidationState>('idle');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animation tick pour l'icône GPS
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

  // Récupère la dernière position connue au montage (indication de distance rapide)
  useEffect(() => {
    Location.getLastKnownPositionAsync().then((loc) => {
      if (loc) setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    });
  }, []);

  // ── Distance et état de proximité ────────────────────────────────────────────

  const distance =
    userPos && coordinates
      ? haversineDistance(userPos.lat, userPos.lng, coordinates.lat, coordinates.lng)
      : null;

  const isClose = distance !== null && distance <= validationRadius;

  // ── Validation ────────────────────────────────────────────────────────────────

  const handleValidate = async () => {
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
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
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
      setState('success');
      // Invalide la progression pour que HuntDetailScreen se recharge
      await queryClient.invalidateQueries({ queryKey: ['hunt', huntId, 'progress'] });
      // Retour automatique après 1,5 s
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('radius')) {
        setState('error_range');
        setErrorMsg('Vous n\'êtes pas assez proche de la destination. Rapprochez-vous et réessayez.');
      } else {
        setState('error_other');
        setErrorMsg(msg ?? 'Une erreur est survenue. Réessayez.');
      }
    }
  };

  const isLoading = state === 'locating' || state === 'validating';

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info étape */}
      <View style={styles.stepCard}>
        <Text style={styles.stepLabel}>Étape en cours</Text>
        <Text style={styles.stepTitle}>{stepTitle}</Text>
        {stepDescription ? (
          <Text style={styles.stepDesc}>{stepDescription}</Text>
        ) : null}
      </View>

      {/* Rayon de validation */}
      <View style={styles.radiusChip}>
        <Text style={styles.radiusChipText}>
          📏 Rayon de validation : {validationRadius} m
        </Text>
      </View>

      {/* Indicateur de distance */}
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

      {/* État de chargement */}
      {state === 'locating' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>Obtention de votre position GPS…</Text>
        </View>
      )}
      {state === 'validating' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>Validation en cours…</Text>
        </View>
      )}

      {/* Succès */}
      {state === 'success' && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>Étape validée ! Bravo !</Text>
        </View>
      )}

      {/* Erreur */}
      {(state === 'error_range' || state === 'error_other') && errorMsg && (
        <View style={[
          styles.errorBanner,
          state === 'error_range' ? styles.errorBannerRange : styles.errorBannerOther,
        ]}>
          <Text style={styles.errorIcon}>
            {state === 'error_range' ? '📍' : '⚠️'}
          </Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Bouton principal */}
      {state !== 'success' && (
        <TouchableOpacity
          style={[styles.validateBtn, isLoading && styles.validateBtnDisabled]}
          onPress={handleValidate}
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

      {/* Hint */}
      {state === 'idle' && (
        <Text style={styles.hint}>
          Rendez-vous à l'emplacement de l'étape, puis appuyez sur le bouton pour valider votre présence.
        </Text>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
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
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  stepDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  radiusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  radiusChipText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '500',
  },
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
  distanceCardClose: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  distanceCardFar: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  distanceCardUnknown: {
    borderColor: '#E5E7EB',
  },
  distanceIcon: {
    fontSize: 32,
  },
  distanceInfo: {
    flex: 1,
    gap: 3,
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  distanceValueClose: {
    color: '#15803D',
  },
  distanceValueFar: {
    color: '#C2410C',
  },
  distanceSubtext: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#3B82F6',
  },
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
  successText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  errorBannerRange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  errorBannerOther: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorIcon: { fontSize: 20 },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
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
  validateBtnDisabled: {
    opacity: 0.6,
  },
  validateBtnIcon: { fontSize: 18 },
  validateBtnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
});
