import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  CircleLayer,
  FillLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import type { AppTabParamList, AppStackParamList } from '../../navigation/AppNavigator';
import { useHuntsOnMap, useHuntHistory } from '../../hooks/useHunts';
import type { HuntListItem } from '../../services/hunt.service';
import { progressService } from '../../services/progress.service';
import type { StepMapItem, StepStatus } from '@lootopia/shared';
import HuntBottomSheet from './HuntBottomSheet';

const PARIS: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 13;

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F97316',
  hard: '#EF4444',
};

const STEP_COLORS: Record<StepStatus, string> = {
  current: '#22C55E',
  completed: '#9CA3AF',
  locked: '#9CA3AF',
};

type MapNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Map'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function buildCircleGeoJSON(
  lat: number,
  lng: number,
  radiusMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const EARTH_RADIUS = 6_378_137;
  const points = 64;
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dlat = ((radiusMeters / EARTH_RADIUS) * (180 / Math.PI)) * Math.cos(angle);
    const dlng =
      ((radiusMeters / (EARTH_RADIUS * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)) *
      Math.sin(angle);
    coords.push([lng + dlng, lat + dlat]);
  }
  coords.push(coords[0]);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

interface StepMarkerProps {
  status: StepStatus;
  stepId: string;
}

function StepMarker({ status, stepId }: StepMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'current') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [status]);

  const color = STEP_COLORS[status];
  const icon = status === 'completed' ? '✓' : '▶';

  return (
    <Animated.View
      testID={`step-marker-${stepId}`}
      style={[
        styles.stepMarker,
        { backgroundColor: color },
        status === 'current' && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Text style={styles.stepMarkerIcon}>{icon}</Text>
    </Animated.View>
  );
}

export default function MapScreen() {
  const { consentGps, isAuthenticated } = useAuthStore();
  const navigation = useNavigation<MapNavProp>();
  const cameraRef = useRef<CameraRef>(null);

  const [center, setCenter] = useState<[number, number]>(PARIS);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<HuntListItem | null>(null);

  const { data: hunts = [] } = useHuntsOnMap();
  const { data: history = [] } = useHuntHistory();

  const completedIds = useMemo(
    () => new Set(history.filter((h) => h.completed_at !== null).map((h) => h.hunt_id)),
    [history],
  );

  const selectedHuntId = selectedHunt?.id ?? null;

  const { data: progressData } = useQuery({
    queryKey: ['hunt-progress', selectedHuntId],
    queryFn: () => progressService.getHuntProgress(selectedHuntId!),
    enabled: !!selectedHuntId && isAuthenticated,
    retry: false,
  });

  const activeSteps: StepMapItem[] | undefined = progressData?.steps;

  useEffect(() => {
    if (!consentGps) return;
    let cancelled = false;
    (async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setPermissionDenied(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setUserCoords(coords);
          const pos: [number, number] = [coords.lng, coords.lat];
          setCenter(pos);
          cameraRef.current?.setCamera({
            centerCoordinate: pos,
            zoomLevel: DEFAULT_ZOOM,
            animationDuration: 600,
          });
        }
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consentGps]);

  const handleRecenter = useCallback(async () => {
    if (!consentGps || permissionDenied) return;
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserCoords(coords);
      const pos: [number, number] = [coords.lng, coords.lat];
      setCenter(pos);
      cameraRef.current?.setCamera({
        centerCoordinate: pos,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 500,
      });
    } finally {
      setLocating(false);
    }
  }, [consentGps, permissionDenied]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={OSM_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        onPress={() => setSelectedHunt(null)}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={center}
          animationMode="flyTo"
          animationDuration={0}
        />

        {consentGps && !permissionDenied && <UserLocation visible renderMode="normal" />}

        {hunts.map((hunt) => {
          const isCompleted = completedIds.has(hunt.id);
          const color = isCompleted
            ? '#9CA3AF'
            : (DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? '#6B7280');

          return (
            <PointAnnotation
              key={hunt.id}
              id={hunt.id}
              coordinate={[hunt.lng, hunt.lat]}
              onSelected={() => setSelectedHunt(hunt)}
            >
              <View style={[styles.marker, { backgroundColor: color }]}>
                <Text style={styles.markerText}>{isCompleted ? '✓' : '🏴'}</Text>
              </View>
            </PointAnnotation>
          );
        })}

        {activeSteps?.map((step) => {
          if (!step.coordinates) return null;
          const { lat, lng } = step.coordinates;

          return (
            <React.Fragment key={step.id}>
              {step.status === 'current' && (
                <ShapeSource
                  id={`validation-circle-src-${step.id}`}
                  shape={buildCircleGeoJSON(lat, lng, step.validation_radius)}
                >
                  <FillLayer
                    id={`validation-fill-${step.id}`}
                    style={{ fillColor: '#22C55E', fillOpacity: 0.15 }}
                  />
                  <LineLayer
                    id={`validation-line-${step.id}`}
                    style={{ lineColor: '#22C55E', lineWidth: 2 }}
                  />
                </ShapeSource>
              )}

              <PointAnnotation
                id={`step-${step.id}`}
                coordinate={[lng, lat]}
                onSelected={() => {
                  if (step.status === 'current' && selectedHuntId) {
                    navigation.navigate('StepValidation', {
                      huntId: selectedHuntId,
                      stepId: step.id,
                      stepTitle: step.title,
                      stepDescription: step.description,
                      validationType: step.validation_type,
                      validationRadius: step.validation_radius,
                      coordinates: step.coordinates,
                    });
                  }
                }}
              >
                <StepMarker status={step.status} stepId={step.id} />
              </PointAnnotation>
            </React.Fragment>
          );
        })}
      </MapView>

      {locating && (
        <View style={styles.locatingBadge}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.locatingText}>Localisation…</Text>
        </View>
      )}

      {permissionDenied && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Autorisation GPS refusée — carte centrée sur Paris
          </Text>
        </View>
      )}

      {consentGps && !permissionDenied && (
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={handleRecenter}
          activeOpacity={0.8}
          disabled={locating}
        >
          <Text style={styles.recenterIcon}>⊙</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.listBtn}
        onPress={() => navigation.navigate('Hunts')}
        activeOpacity={0.8}
      >
        <Text style={styles.listBtnLabel}>☰ Liste</Text>
      </TouchableOpacity>

      <HuntBottomSheet
        hunt={selectedHunt}
        userLat={userCoords?.lat ?? null}
        userLng={userCoords?.lng ?? null}
        onClose={() => setSelectedHunt(null)}
        onJoin={(hunt) => {
          setSelectedHunt(null);
          navigation.navigate('HuntDetail', { huntId: hunt.id });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerText: { fontSize: 14 },
  stepMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  stepMarkerIcon: { fontSize: 12, color: '#fff', fontWeight: '700' },
  locatingBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  locatingText: { fontSize: 13, color: '#374151' },
  permissionBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  permissionText: { fontSize: 12, color: '#92400E', textAlign: 'center' },
  recenterBtn: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterIcon: { fontSize: 22, color: '#3B82F6' },
  listBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  listBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
