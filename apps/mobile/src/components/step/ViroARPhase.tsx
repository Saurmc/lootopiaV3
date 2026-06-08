import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroARImageMarker,
  ViroARTrackingTargets,
  ViroAmbientLight,
  ViroAnimations,
  ViroMaterials,
  ViroNode,
  ViroBox,
  ViroText,
  Viro3DObject,
} from '@reactvision/react-viro';
import type { ArContent3DSpatial } from '@lootopia/shared';
import { API_BASE_URL } from '../../constants/api.constants';

function resolveUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Matériaux & animations — enregistrés une seule fois au niveau module ─────

try {
  ViroMaterials.createMaterials({
    goldFrame:  { diffuseColor: '#FFD700', lightingModel: 'Constant' },
    glowDisc:   { diffuseColor: 'rgba(255,215,0,0.30)', lightingModel: 'Constant' },
    shadowDisc: { diffuseColor: 'rgba(0,0,0,0.35)',     lightingModel: 'Constant' },
  });
} catch (_) {}

try {
  ViroAnimations.registerAnimations({
    scaleIn:   { properties: { scaleX: 1, scaleY: 1, scaleZ: 1 }, duration: 700, easing: 'Bounce' },
    floatUp:   { properties: { positionY: '+=0.025' }, duration: 1400, easing: 'EaseInEaseOut' },
    floatDown: { properties: { positionY: '-=0.025' }, duration: 1400, easing: 'EaseInEaseOut' },
    float:     [['floatUp'], ['floatDown']],
  });
} catch (_) {}

// ─── Scène AR — composant stable au niveau module (JAMAIS inline) ─────────────
// viroAppProps shape: { artworkImage: string; modelUrl?: string; onMarkerFound: () => void }

const ARTWORK_MAT = 'artworkDisplay';

function ARScene(props: any) {
  const { artworkImage, modelUrl, targetName, onMarkerFound } =
    (props.sceneNavigator?.viroAppProps ?? {}) as {
      artworkImage: string;
      modelUrl?: string;
      targetName: string;
      onMarkerFound?: () => void;
    };

  const [detected, setDetected] = useState(false);

  const handleAnchorFound = () => {
    if (detected) return;
    setDetected(true);
    onMarkerFound?.();
  };

  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={1200} />

      <ViroARImageMarker target={targetName} onAnchorFound={handleAnchorFound}>
        {modelUrl ? (
          <Viro3DObject
            source={{ uri: modelUrl }}
            position={[0, 0.05, 0]}
            scale={[0.1, 0.1, 0.1]}
            type="OBJ"
          />
        ) : detected ? (
          /* Monté seulement quand détecté — scaleIn (bounce) puis float en boucle */
          <ViroNode
            scale={[0.001, 0.001, 0.001]}
            animation={{ name: 'scaleIn', run: true, loop: false }}
          >
            {/* Disque de lueur au sol */}
            <ViroBox
              width={0.24}
              height={0.003}
              length={0.24}
              position={[0, 0.001, 0]}
              materials={['glowDisc']}
            />

            {/* Tableau flottant — rotation -90° X pour que la face pointe vers le haut (+Y)
                afin d'être visible depuis la caméra regardant vers le bas (marker à plat) */}
            <ViroNode
              position={[0, 0.05, 0]}
              rotation={[-90, 0, 0]}
              animation={{ name: 'float', run: true, loop: true }}
            >
              {/* L'œuvre — face +Z pivotée vers +Y (visible depuis le dessus) */}
              <ViroBox
                width={0.155}
                height={0.205}
                length={0.002}
                position={[0, 0, 0]}
                materials={[ARTWORK_MAT]}
              />
              {/* Label visible depuis le dessus */}
              <ViroText
                text="Oeuvre devoilee !"
                scale={[0.045, 0.045, 0.045]}
                position={[0, 0.120, 0]}
                style={arTextStyle}
              />
            </ViroNode>
          </ViroNode>
        ) : null}
      </ViroARImageMarker>
    </ViroARScene>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViroARPhaseProps {
  arContent: ArContent3DSpatial;
  onConfirm: () => void;
  isValidating: boolean;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ViroARPhase({ arContent, onConfirm, isValidating }: ViroARPhaseProps) {
  const [markerDetected, setMarkerDetected] = useState(false);
  const [targetReady, setTargetReady] = useState(false);

  const markerUrl  = resolveUrl(arContent.marker_image);
  const artworkUrl = resolveUrl(arContent.artwork_image ?? arContent.marker_image);

  // Nom de cible unique par étape — évite que la session AR native continue de
  // reconnaître l'image de l'étape précédente (la cible "markerTarget" fixe restait active)
  const targetNameRef = useRef(`markerTarget_${Math.random().toString(36).slice(2)}`);
  const targetName = targetNameRef.current;

  // Ref stable pour éviter de recréer viroAppProps à chaque render
  const onMarkerFoundRef = useRef(() => setMarkerDetected(true));

  useEffect(() => {
    setTargetReady(false);
    ViroARTrackingTargets.createTargets({
      [targetName]: {
        source: { uri: markerUrl },
        orientation: 'Up',
        physicalWidth: 0.2,
      },
    });
    // Pré-enregistre le material artwork avant de monter la scène pour éviter
    // que ViroBox rende en jaune (couleur par défaut Viro = material manquant)
    if (artworkUrl) {
      try {
        ViroMaterials.createMaterials({
          [ARTWORK_MAT]: {
            diffuseTexture: { uri: artworkUrl },
            lightingModel: 'Constant',
          },
        });
      } catch (_) {}
    }
    // Délai suffisant pour que Viro enregistre cible + material avant de monter la scène
    const t = setTimeout(() => setTargetReady(true), 600);
    return () => {
      clearTimeout(t);
      ViroARTrackingTargets.deleteTarget(targetName);
    };
  }, [arContent.marker_image, artworkUrl, targetName]);

  const isDisabled = !markerDetected || isValidating;

  return (
    <>
      <View style={[componentStyles.cameraContainer, markerDetected && componentStyles.cameraDetected]}>
        {targetReady ? (
          <ViroARSceneNavigator
            autofocus
            viroAppProps={{
              artworkImage: artworkUrl,
              modelUrl: arContent.model_url ? resolveUrl(arContent.model_url) : undefined,
              targetName,
              onMarkerFound: onMarkerFoundRef.current,
            }}
            initialScene={{ scene: ARScene }}
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
            {markerDetected ? "✔️ Valider l'étape" : "⏳ Pointez sur l'œuvre…"}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );
}

// ─── Styles ViroText (objet JS, pas StyleSheet) ───────────────────────────────

const arTextStyle = {
  fontFamily: 'Arial',
  fontSize: 20,
  color: '#FFD700',
  fontWeight: '600' as const,
  textAlignVertical: 'center' as const,
  textAlign: 'center' as const,
};

// ─── Styles RN ────────────────────────────────────────────────────────────────

const componentStyles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: 'transparent',
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
