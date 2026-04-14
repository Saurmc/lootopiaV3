import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  MapView,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../store/auth.store';
import type { AppTabParamList } from '../../navigation/AppNavigator';

// Position par défaut : Paris
const PARIS: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 13;

// Style raster OpenStreetMap (aucune clé API requise)
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
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

type MapNavProp = BottomTabNavigationProp<AppTabParamList, 'Map'>;

/**
 * MapScreen — carte interactive centrée sur la position GPS de l'utilisateur.
 * Si le consentement GPS est absent, affiche Paris par défaut.
 */
export default function MapScreen() {
  const { consentGps } = useAuthStore();
  const navigation = useNavigation<MapNavProp>();
  const cameraRef = useRef<CameraRef>(null);

  const [center, setCenter] = useState<[number, number]>(PARIS);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Au montage : si consentement GPS, on demande la permission OS et on récupère la position
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
          const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
          setCenter(coords);
          cameraRef.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: DEFAULT_ZOOM,
            animationDuration: 600,
          });
        }
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [consentGps]);

  const handleRecenter = useCallback(async () => {
    if (!consentGps || permissionDenied) return;
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setCenter(coords);
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
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
      >
        <Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={center}
          animationMode="flyTo"
          animationDuration={0}
        />
        {consentGps && !permissionDenied && (
          <UserLocation visible renderMode="normal" />
        )}
      </MapView>

      {/* Indicateur de localisation en cours */}
      {locating && (
        <View style={styles.locatingBadge}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.locatingText}>Localisation…</Text>
        </View>
      )}

      {/* Message si permission OS refusée */}
      {permissionDenied && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Autorisation GPS refusée — carte centrée sur Paris
          </Text>
        </View>
      )}

      {/* Bouton Recentrer */}
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

      {/* Bouton Liste */}
      <TouchableOpacity
        style={styles.listBtn}
        onPress={() => navigation.navigate('Hunts')}
        activeOpacity={0.8}
      >
        <Text style={styles.listBtnLabel}>☰ Liste</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
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
  locatingText: {
    fontSize: 13,
    color: '#374151',
  },
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
  permissionText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
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
  recenterIcon: {
    fontSize: 22,
    color: '#3B82F6',
  },
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
  listBtnLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
