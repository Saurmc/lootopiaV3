import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroARImageMarker,
  ViroARTrackingTargets,
  Viro3DObject,
  ViroImage,
} from '@reactvision/react-viro';
import type { ArContent3DSpatial } from '@lootopia/shared';

interface ViroARPhaseProps {
  arContent: ArContent3DSpatial;
  onConfirm: () => void;
  isValidating: boolean;
}

interface ARSceneProps {
  markerImage: string;
  modelUrl?: string;
  onMarkerFound: () => void;
}

function ARScene({ markerImage, modelUrl, onMarkerFound }: ARSceneProps) {
  useEffect(() => {
    ViroARTrackingTargets.createTargets({
      markerTarget: {
        source: { uri: markerImage },
        orientation: 'Up',
        physicalWidth: 0.2,
      },
    });
  }, [markerImage]);

  return (
    <ViroARScene>
      <ViroARImageMarker
        target="markerTarget"
        onAnchorFound={onMarkerFound}
      >
        {modelUrl ? (
          <Viro3DObject
            source={{ uri: modelUrl }}
            position={[0, 0, 0]}
            scale={[0.1, 0.1, 0.1]}
            type="OBJ"
          />
        ) : (
          <ViroImage
            source={{ uri: markerImage }}
            position={[0, 0.05, 0]}
            scale={[0.2, 0.2, 0.2]}
          />
        )}
      </ViroARImageMarker>
    </ViroARScene>
  );
}

export default function ViroARPhase({ arContent, onConfirm, isValidating }: ViroARPhaseProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [markerDetected, setMarkerDetected] = useState(false);

  if (!permission) {
    return (
      <View style={styles.placeholder}>
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
          Pour cette étape de réalité augmentée, autorisez l'accès à votre caméra.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.btnLabel}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDisabled = !markerDetected || isValidating;

  return (
    <>
      <View style={[styles.cameraContainer, markerDetected && styles.cameraDetected]}>
        <ViroARSceneNavigator
          autofocus
          initialScene={{
            scene: () => (
              <ARScene
                markerImage={arContent.marker_image}
                modelUrl={arContent.model_url}
                onMarkerFound={() => setMarkerDetected(true)}
              />
            ),
          }}
          style={StyleSheet.absoluteFillObject}
        />
        {markerDetected && (
          <View style={styles.detectedBadge}>
            <Text style={styles.detectedBadgeText}>Marqueur reconnu ✅</Text>
          </View>
        )}
        {!markerDetected && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Pointez votre caméra sur le marqueur imprimé</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btn, isDisabled && styles.btnDisabled]}
        onPress={onConfirm}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {isValidating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.btnLabel}>
            {markerDetected ? '✔️ Valider' : '⏳ En attente du marqueur…'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: 320,
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
  cameraContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cameraDetected: {
    borderColor: '#22C55E',
  },
  detectedBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(34,197,94,0.9)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  detectedBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  btn: {
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
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
