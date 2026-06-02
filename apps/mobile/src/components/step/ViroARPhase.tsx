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
  ViroAnimations,
  ViroMaterials,
  ViroNode,
  ViroSphere,
  ViroBox,
  ViroText,
  Viro3DObject,
} from '@reactvision/react-viro';
import type { ArContent3DSpatial } from '@lootopia/shared';

// ─── Matériaux & animations (une seule fois au chargement du module) ──────────

try {
  ViroMaterials.createMaterials({
    goldOrb: {
      diffuseColor: '#FFD700',
      lightingModel: 'Phong',
      shininess: 2.0,
    },
    glowDisc: {
      diffuseColor: 'rgba(255,215,0,0.25)',
      lightingModel: 'Constant',
    },
  });
} catch (_) {}

try {
  ViroAnimations.registerAnimations({
    rotateOrb:  { properties: { rotateY: '+=360' }, duration: 4000 },
    floatUp:    { properties: { positionY: '+=0.025' }, duration: 1400, easing: 'EaseInEaseOut' },
    floatDown:  { properties: { positionY: '-=0.025' }, duration: 1400, easing: 'EaseInEaseOut' },
    float:      [['floatUp'], ['floatDown']],
  });
} catch (_) {}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViroARPhaseProps {
  arContent: ArContent3DSpatial;
  onConfirm: () => void;
  isValidating: boolean;
}

interface ARSceneProps {
  modelUrl?: string;
  markerImage: string;
  onMarkerFound: () => void;
}

// ─── Scène AR ─────────────────────────────────────────────────────────────────

function ArtDiscoveryScene() {
  return (
    <ViroNode position={[0, 0.07, 0]} animation={{ name: 'float', run: true, loop: true }}>
      {/* Orbe doré rotatif */}
      <ViroSphere
        radius={0.045}
        position={[0, 0, 0]}
        materials={['goldOrb']}
        animation={{ name: 'rotateOrb', run: true, loop: true }}
      />
      {/* Halo légèrement plus grand, semi-transparent */}
      <ViroSphere
        radius={0.055}
        position={[0, 0, 0]}
        materials={['glowDisc']}
      />
      {/* Texte flottant au-dessus */}
      <ViroText
        text={'Oeuvre devoilee !'}
        scale={[0.06, 0.06, 0.06]}
        position={[0, 0.1, 0]}
        style={styles.arText}
      />
    </ViroNode>
  );
}

function ArtDiscoveryDisc() {
  return (
    <ViroBox
      width={0.22}
      height={0.003}
      length={0.22}
      position={[0, 0, 0]}
      materials={['glowDisc']}
    />
  );
}

function ARScene({ modelUrl, markerImage, onMarkerFound }: ARSceneProps) {
  return (
    <ViroARScene>
      <ViroARImageMarker target="markerTarget" onAnchorFound={onMarkerFound}>
        {modelUrl ? (
          <Viro3DObject
            source={{ uri: modelUrl }}
            position={[0, 0.05, 0]}
            scale={[0.1, 0.1, 0.1]}
            type="OBJ"
          />
        ) : (
          <>
            <ArtDiscoveryDisc />
            <ArtDiscoveryScene />
          </>
        )}
      </ViroARImageMarker>
    </ViroARScene>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ViroARPhase({ arContent, onConfirm, isValidating }: ViroARPhaseProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [markerDetected, setMarkerDetected] = useState(false);
  const [targetReady, setTargetReady] = useState(false);

  useEffect(() => {
    ViroARTrackingTargets.createTargets({
      markerTarget: {
        source: { uri: arContent.marker_image },
        orientation: 'Up',
        physicalWidth: 0.2,
      },
    });
    setTargetReady(true);
  }, [arContent.marker_image]);

  if (!permission) {
    return <View style={componentStyles.placeholder}><ActivityIndicator color="#3B82F6" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={componentStyles.permissionBox}>
        <Text style={componentStyles.permissionIcon}>📷</Text>
        <Text style={componentStyles.permissionTitle}>Accès caméra requis</Text>
        <Text style={componentStyles.permissionText}>
          Pour cette étape de réalité augmentée, autorisez l'accès à votre caméra.
        </Text>
        <TouchableOpacity style={componentStyles.btn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={componentStyles.btnLabel}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDisabled = !markerDetected || isValidating;

  return (
    <>
      <View style={[componentStyles.cameraContainer, markerDetected && componentStyles.cameraDetected]}>
        {targetReady ? (
          <ViroARSceneNavigator
            autofocus
            initialScene={{
              scene: () => (
                <ARScene
                  modelUrl={arContent.model_url}
                  markerImage={arContent.marker_image}
                  onMarkerFound={() => setMarkerDetected(true)}
                />
              ),
            }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={componentStyles.loading}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {markerDetected && (
          <View style={componentStyles.detectedBadge}>
            <Text style={componentStyles.detectedBadgeText}>Œuvre reconnue ✅</Text>
          </View>
        )}
        {!markerDetected && targetReady && (
          <View style={componentStyles.hint}>
            <Text style={componentStyles.hintText}>Pointez la caméra sur l'œuvre d'art</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[componentStyles.btn, isDisabled && componentStyles.btnDisabled]}
        onPress={onConfirm}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {isValidating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={componentStyles.btnLabel}>
            {markerDetected ? '✔️ Valider l\'étape' : '⏳ En attente de l\'œuvre…'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );
}

// ─── Styles ViroText (objet JS, pas StyleSheet) ───────────────────────────────

const styles = {
  arText: {
    fontFamily: 'Arial',
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '600' as const,
    textAlignVertical: 'center' as const,
    textAlign: 'center' as const,
  },
};

// ─── Styles RN ────────────────────────────────────────────────────────────────

const componentStyles = StyleSheet.create({
  placeholder: {
    width: '100%', height: 320,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E5E7EB', borderRadius: 16,
  },
  permissionBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  permissionIcon: { fontSize: 40 },
  permissionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  permissionText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  cameraContainer: {
    width: '100%', height: 320, borderRadius: 16,
    overflow: 'hidden', backgroundColor: '#000',
    borderWidth: 3, borderColor: 'transparent',
  },
  cameraDetected: { borderColor: '#22C55E' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detectedBadge: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(34,197,94,0.9)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16,
  },
  detectedBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: {
    position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center',
  },
  hintText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
