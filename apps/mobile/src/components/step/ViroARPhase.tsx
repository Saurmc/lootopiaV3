import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroARImageMarker,
  ViroARObjectMarker,
  ViroARTrackingTargets,
  ViroAmbientLight,
  ViroAnimations,
  ViroMaterials,
  ViroNode,
  ViroBox,
  ViroImage,
  ViroText,
  Viro3DObject,
} from '@reactvision/react-viro';
import type { ArContent3DSpatial } from '@lootopia/shared';

// ─── Matériaux statiques ─────────────────────────────────────────────────────

try {
  ViroMaterials.createMaterials({
    glowDisc:   { diffuseColor: 'rgba(255,215,0,0.30)', lightingModel: 'Constant' },
    shadowDisc: { diffuseColor: 'rgba(0,0,0,0.45)',     lightingModel: 'Constant' },
  });
} catch (_) {}

try {
  ViroAnimations.registerAnimations({
    floatUp:     { properties: { positionY: '+=0.022' }, duration: 1500, easing: 'EaseInEaseOut' },
    floatDown:   { properties: { positionY: '-=0.022' }, duration: 1500, easing: 'EaseInEaseOut' },
    float:       [['floatUp'], ['floatDown']],
    rotateModel: { properties: { rotateY: '+=360' }, duration: 6000 },
    pulseUp:     { properties: { scaleX: 1.08, scaleY: 1.08, scaleZ: 1.08 }, duration: 800, easing: 'EaseInEaseOut' },
    pulseDown:   { properties: { scaleX: 1.00, scaleY: 1.00, scaleZ: 1.00 }, duration: 800, easing: 'EaseInEaseOut' },
    pulse:       [['pulseUp'], ['pulseDown']],
  });
} catch (_) {}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViroARPhaseProps {
  arContent: ArContent3DSpatial;
  onConfirm: () => void;
  isValidating: boolean;
}

interface ARSceneProps {
  mode: 'image' | 'object';
  localImageUri: string;
  localModelUri?: string;
  modelType: 'GLTF' | 'OBJ' | 'VRX';
  onMarkerFound: () => void;
}

// ─── Contenu commun (3D model ou image 2D) ────────────────────────────────────

function ARContent({ localImageUri, localModelUri, modelType }: Omit<ARSceneProps, 'mode' | 'onMarkerFound'>) {
  if (localModelUri) {
    console.log('[AR] Rendering Viro3DObject, uri=', localModelUri, 'type=', modelType);
    return (
      <ViroNode>
        <ViroBox width={0.30} height={0.003} length={0.30}
          position={[0.008, 0.001, -0.008]} materials={['shadowDisc']} />
        <ViroBox width={0.26} height={0.001} length={0.26}
          position={[0, 0.0005, 0]} materials={['glowDisc']} />
        <ViroNode position={[0, 0.12, 0]}
          animation={{ name: 'rotateModel', run: true, loop: true }}>
          <Viro3DObject
            source={{ uri: localModelUri }}
            scale={[0.20, 0.20, 0.20]}
            type={modelType}
            onLoadStart={() => console.log('[AR] 3D model load start')}
            onLoadEnd={() => console.log('[AR] 3D model load end')}
            onError={(e: any) => console.error('[AR] 3D model error', e)}
          />
        </ViroNode>
      </ViroNode>
    );
  }
  return (
    <ViroNode>
      <ViroBox width={0.26} height={0.003} length={0.10}
        position={[0.007, 0.001, -0.007]} materials={['shadowDisc']} />
      <ViroBox width={0.22} height={0.001} length={0.08}
        position={[0, 0.0005, 0]} materials={['glowDisc']} />
      <ViroNode position={[0, 0.16, 0]}
        animation={{ name: 'float', run: true, loop: true }}
        transformBehaviors={['billboard']}>
        <ViroImage source={{ uri: localImageUri }} width={0.18} height={0.24} />
      </ViroNode>
    </ViroNode>
  );
}

// ─── Scène AR ─────────────────────────────────────────────────────────────────

function ARScene({ mode, localImageUri, localModelUri, modelType, onMarkerFound }: ARSceneProps) {
  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={800} />

      {mode === 'object' ? (
        // Détection d'objet 3D physique (statue…) via .arobject
        <ViroARObjectMarker target="objectTarget" onAnchorFound={onMarkerFound}>
          <ViroNode animation={{ name: 'pulse', run: true, loop: true }}>
            <ViroText
              text="Œuvre détectée !"
              scale={[0.06, 0.06, 0.06]}
              position={[0, 0.15, 0]}
              transformBehaviors={['billboard']}
              style={arTextStyle}
            />
            <ARContent
              localImageUri={localImageUri}
              localModelUri={localModelUri}
              modelType={modelType}
            />
          </ViroNode>
        </ViroARObjectMarker>
      ) : (
        // Détection d'image 2D (peinture, affiche…) via image marker
        <ViroARImageMarker target="markerTarget" onAnchorFound={onMarkerFound}>
          <ARContent
            localImageUri={localImageUri}
            localModelUri={localModelUri}
            modelType={modelType}
          />
        </ViroARImageMarker>
      )}
    </ViroARScene>
  );
}

const arTextStyle = {
  fontFamily: 'Arial',
  fontSize: 18,
  color: '#FFD700',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveModelType(url: string, explicit?: 'GLTF' | 'OBJ' | 'VRX'): 'GLTF' | 'OBJ' | 'VRX' {
  if (explicit) return explicit;
  const ext = url.split('.').pop()?.split('?')[0].toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return 'GLTF';
  if (ext === 'vrx') return 'VRX';
  return 'OBJ';
}

async function downloadToCache(remoteUrl: string, cacheKey: string): Promise<string> {
  const ext = remoteUrl.split('.').pop()?.split('?')[0] ?? 'bin';
  const dest = `${FileSystem.cacheDirectory}${cacheKey}.${ext}`;
  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists) {
    await FileSystem.downloadAsync(remoteUrl, dest);
  }
  return dest; // file:// URI
}

async function downloadAsDataUri(remoteUrl: string, cacheKey: string): Promise<string> {
  const ext = (remoteUrl.split('.').pop()?.split('?')[0] ?? 'png').toLowerCase();
  const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
  const dest = `${FileSystem.cacheDirectory}${cacheKey}.${ext}`;
  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists) {
    await FileSystem.downloadAsync(remoteUrl, dest);
  }
  const b64 = await FileSystem.readAsStringAsync(dest, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mime};base64,${b64}`;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ViroARPhase({ arContent, onConfirm, isValidating }: ViroARPhaseProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [markerDetected, setMarkerDetected] = useState(false);
  const [ready, setReady] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [localModelUri, setLocalModelUri] = useState<string | undefined>(undefined);
  const [modelType, setModelType] = useState<'GLTF' | 'OBJ' | 'VRX'>('GLTF');

  const mode: 'image' | 'object' = arContent.object_scan ? 'object' : 'image';

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      // Image marqueur (fallback ou affichage 2D) → data-URI
      const imgUrl = arContent.marker_image ?? arContent.object_scan ?? '';
      try {
        const imgUri = await downloadAsDataUri(imgUrl, 'ar_artwork');
        if (!cancelled) setLocalImageUri(imgUri);
      } catch {
        if (!cancelled) setLocalImageUri(imgUrl);
      }

      // Modèle 3D optionnel → file:// local
      if (arContent.model_url) {
        try {
          console.log('[AR] downloading model from', arContent.model_url);
          const modelUri = await downloadToCache(arContent.model_url, 'ar_model');
          console.log('[AR] model cached at', modelUri);
          if (!cancelled) {
            setLocalModelUri(modelUri);
            setModelType(resolveModelType(arContent.model_url, arContent.model_type));
          }
        } catch (e) {
          console.error('[AR] model download failed:', e);
          if (!cancelled) {
            setLocalModelUri(arContent.model_url);
            setModelType(resolveModelType(arContent.model_url, arContent.model_type));
          }
        }
      }

      // Enregistrement de la cible de tracking
      if (arContent.object_scan) {
        // Mode objet 3D : fichier .arobject téléchargé en local
        try {
          const localScan = await downloadToCache(arContent.object_scan, 'ar_scan');
          ViroARTrackingTargets.createTargets({
            objectTarget: {
              source: { uri: localScan },
              type: 'Object',
            },
          });
        } catch {
          ViroARTrackingTargets.createTargets({
            objectTarget: {
              source: { uri: arContent.object_scan },
              type: 'Object',
            },
          });
        }
      } else if (arContent.marker_image) {
        // Mode image 2D : marqueur plat
        ViroARTrackingTargets.createTargets({
          markerTarget: {
            source: { uri: arContent.marker_image },
            orientation: 'Up',
            physicalWidth: 0.2,
          },
        });
      }

      if (!cancelled) setReady(true);
    };

    prepare();
    return () => { cancelled = true; };
  }, [arContent.marker_image, arContent.object_scan, arContent.model_url]);

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
        {(ready && localImageUri) ? (
          <ViroARSceneNavigator
            autofocus
            initialScene={{
              scene: () => (
                <ARScene
                  mode={mode}
                  localImageUri={localImageUri}
                  localModelUri={localModelUri}
                  modelType={modelType}
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
        {!markerDetected && ready && (
          <View style={componentStyles.hint}>
            <Text style={componentStyles.hintText}>
              {mode === 'object'
                ? 'Pointez la caméra sur la statue / sculpture'
                : 'Pointez la caméra sur l\'œuvre d\'art'}
            </Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
