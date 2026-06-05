import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  MapView,
  PointAnnotation,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/auth.store';
import theme from '../../constants/theme';
import type { AppTabParamList, AppStackParamList } from '../../navigation/AppNavigator';
import { useHuntsOnMap, useHuntHistory } from '../../hooks/useHunts';
import type { HuntListItem } from '../../services/hunt.service';
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

// PNG 2×100px généré : #242156 à 90%→60%→0% (stops Figma exacts, interpolation GPU)
const GRADIENT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAABkCAYAAACsG+FjAAABCUlEQVR4nB3GQSsDAACA0ZXDaoeVg1I7iKQclINaOSgH5aDUDisHtcNK7bByUA6rHVbKQTmsFCJEIyJELDIRIkQjGhH5HfZ2eF9foLU5/kegml/MD+Yb84X5xHxgKph3zBvmFfOCKWOeMU+YR8wD5h5zh7nF3GCuMVeYS8wF5hxTwpxhTjEnmCLmGHOEOcQcYPYxe5hdzA5mG7OF2cRsYNYxBcwaZhWzglnGLGEWMQuYecwcZhYzg8ljpjFTmEnMBCaHyWIymHHMGGYUk8akMCOYJCaBGcYMYeKYGGYQM4Dpx/RhejE9mG5MFNOF6cR0YNoxbZgWTBMmgmnENGDqMWFMCBPE1GFq/gG/yeX5d7aTDAAAAABJRU5ErkJggg==';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F97316',
  hard: '#EF4444',
};


type MapNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Map'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export default function MapScreen() {
  const { consentGps } = useAuthStore();
  const navigation = useNavigation<MapNavProp>();
  const cameraRef = useRef<CameraRef>(null);
  const insets = useSafeAreaInsets();

  const [center, setCenter] = useState<[number, number]>(PARIS);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<HuntListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityName, setCityName] = useState<string | null>(null);

  const { data: hunts = [] } = useHuntsOnMap();
  const { data: history = [] } = useHuntHistory();

  const completedIds = useMemo(
    () => new Set(history.filter((h) => h.completed_at !== null).map((h) => h.hunt_id)),
    [history],
  );

  // Filtre les marqueurs par recherche
  const visibleHunts = useMemo(() => {
    if (!searchQuery.trim()) return hunts;
    const q = searchQuery.toLowerCase();
    return hunts.filter((h) => h.title.toLowerCase().includes(q));
  }, [hunts, searchQuery]);

  // Nom de ville via IP geolocation — aucune permission GPS requise
  useEffect(() => {
    let cancelled = false;
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data: { city?: string; region?: string }) => {
        if (!cancelled && (data.city ?? data.region)) {
          setCityName(data.city ?? data.region ?? null);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
          // Reverse geocoding — chaîne de fallback élargie (city/district/subregion/name)
          const geocoded = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (!cancelled && geocoded[0]) {
            const addr = geocoded[0];
            setCityName(prev => prev ?? addr.city ?? addr.district ?? addr.subregion ?? addr.name ?? null);
          }
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

  // Gradient couvre UNIQUEMENT la ligne logo+ville (pas la search bar)
  const logoCityRowH = insets.top + 52;

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

        {visibleHunts.map((hunt) => {
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
      </MapView>

      {/* ── Gradient PNG Base64 : #242156 90%→60%→0% — zéro module natif ── */}
      <Image
        source={{ uri: `data:image/png;base64,${GRADIENT_PNG}` }}
        style={[styles.gradientImage, { height: logoCityRowH + 28 }]}
        resizeMode="stretch"
        pointerEvents="none"
      />

      {/* ── Contenu interactif de l'overlay ── */}
      <View
        style={[styles.overlayContent, { paddingTop: insets.top + theme.spacing.sm }]}
        pointerEvents="box-none"
      >
        {/* Ligne 1 : Logo à gauche, Ville à droite */}
        <View style={styles.topRow} pointerEvents="box-none">
          <Text style={styles.logoText}>Lootopia</Text>
          <View style={styles.cityBadge} pointerEvents="none">
            {locating ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <>
                <Ionicons name="location-sharp" size={11} color={theme.colors.textInverse} />
                {cityName ? <Text style={styles.cityText}>{cityName}</Text> : null}
              </>
            )}
          </View>
        </View>

        {/* Ligne 2 : Search bar + Hamburger */}
        <View style={styles.searchRow} pointerEvents="box-none">
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search-outline" size={15} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une chasse…"
              placeholderTextColor={theme.colors.textDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => navigation.navigate('HuntsList')}
            activeOpacity={0.8}
          >
            <Ionicons name="menu" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Bannière permission refusée */}
        {permissionDenied && (
          <View style={styles.permissionBanner}>
            <Ionicons name="warning-outline" size={13} color={theme.colors.warning} />
            <Text style={styles.permissionText}>
              GPS refusé — carte centrée sur Paris
            </Text>
          </View>
        )}
      </View>

      {/* ── Bouton Recentrer ── */}
      {consentGps && !permissionDenied && (
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={handleRecenter}
          activeOpacity={0.8}
          disabled={locating}
        >
          <Ionicons name="locate" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      )}

      {/* ── Bottom sheet chasse sélectionnée ── */}
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

  // ── Markers (intouchables) ──
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


  // ── Gradient PNG overlay ──
  gradientImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },

  // ── Overlay content ──
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.textInverse,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cityText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '600',
  },

  // ── Search row ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  hamburgerBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },

  // ── Permission banner (inside overlay) ──
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  permissionText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },

  // ── Recenter button ──
  recenterBtn: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
});
