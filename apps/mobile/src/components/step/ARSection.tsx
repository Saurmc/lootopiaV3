import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import type { ArContent3DSpatial } from '@lootopia/shared';
import ViroARPhase from './ViroARPhase';
import { resolveFileUrl } from '../../utils/url.utils';

export type ArContent2DOverlay = { type: '2d-overlay'; image: string };
export type ArContentQROverlay = { type: 'qr-overlay'; qr_trigger: string; image: string };
export type ArContent = ArContent2DOverlay | ArContentQROverlay | ArContent3DSpatial;

interface ARSectionProps {
  arContent: ArContent;
  onConfirm: (qrCode?: string) => void;
  validating?: boolean;
  errorMsg?: string | null;
}

// ─── Permission denied ────────────────────────────────────────────────────────

function PermissionDenied({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={styles.permissionBox}>
      <Text style={styles.permissionIcon}>📷</Text>
      <Text style={styles.permissionTitle}>Accès caméra requis</Text>
      <Text style={styles.permissionText}>
        Pour cette étape de réalité augmentée, autorisez l'accès à votre caméra.
      </Text>
      <TouchableOpacity style={styles.validateBtn} onPress={onRequest} activeOpacity={0.8}>
        <Text style={styles.validateBtnLabel}>Autoriser la caméra</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Phase 1 : Scan QR ────────────────────────────────────────────────────────

interface QRScanPhaseProps {
  onDetected: (code: string) => void;
  errorMsg?: string | null;
  onRetry?: () => void;
}

function QRScanPhase({ onDetected, errorMsg, onRetry }: QRScanPhaseProps) {
  const [scanned, setScanned] = useState(false);

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onDetected(result.data);
  };

  return (
    <>
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        <View style={styles.cameraLabel}>
          <Text style={styles.cameraLabelText}>Scannez le QR code caché</Text>
        </View>
      </View>

      {errorMsg && (
        <>
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerIcon}>⚠️</Text>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setScanned(false); onRetry(); }} activeOpacity={0.8}>
              <Text style={styles.retryBtnLabel}>🔄 Réessayer</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {!errorMsg && (
        <Text style={styles.hint}>
          Trouvez et scannez le QR code dissimulé pour révéler le contenu AR.
        </Text>
      )}
    </>
  );
}

// ─── Phase 2 : Overlay AR ─────────────────────────────────────────────────────

interface OverlayPhaseProps {
  image: string;
  onConfirm: () => void;
  validating: boolean;
}

function OverlayPhase({ image, onConfirm, validating }: OverlayPhaseProps) {
  return (
    <>
      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
        <Image source={{ uri: image }} style={styles.overlay} resizeMode="contain" />
        <View style={styles.arBadge}>
          <Text style={styles.arBadgeText}>✨ Contenu AR révélé !</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Le contenu AR est apparu ! Confirmez que vous le voyez pour valider l'étape.
      </Text>

      <TouchableOpacity
        style={[styles.validateBtn, validating && styles.validateBtnDisabled]}
        onPress={onConfirm}
        disabled={validating}
        activeOpacity={0.8}
      >
        {validating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.validateBtnIcon}>✔️</Text>
            <Text style={styles.validateBtnLabel}>Je le vois — Valider</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

// ─── ARSection (orchestrateur) ────────────────────────────────────────────────

export default function ARSection({ arContent, onConfirm, validating = false, errorMsg }: ARSectionProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<'scanning' | 'overlay'>(
    arContent.type === 'qr-overlay' ? 'scanning' : 'overlay',
  );
  const [scannedCode, setScannedCode] = useState<string | undefined>();

  if (!permission) {
    return <View style={styles.cameraPlaceholder}><ActivityIndicator color="#3B82F6" /></View>;
  }

  if (!permission.granted) {
    return <PermissionDenied onRequest={requestPermission} />;
  }

  if (phase === 'scanning' && arContent.type === 'qr-overlay') {
    const handleDetected = (code: string) => {
      setScannedCode(code);
      if (code === arContent.qr_trigger) {
        setPhase('overlay');
      } else {
        // Wrong QR — stay in scanning, let parent show error via onConfirm + wrong code
        onConfirm(code);
      }
    };

    return (
      <QRScanPhase
        onDetected={handleDetected}
        errorMsg={errorMsg}
        onRetry={() => setScannedCode(undefined)}
      />
    );
  }

  if (arContent.type === 'ar-3d-spatial') {
    return (
      <ViroARPhase
        arContent={arContent}
        onConfirm={() => onConfirm()}
        isValidating={validating}
      />
    );
  }

  return (
    <OverlayPhase
      image={resolveFileUrl(arContent.image)}
      onConfirm={() => onConfirm(scannedCode)}
      validating={validating}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER_SIZE = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.85,
  },
  arBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(29,78,216,0.85)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  arBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cameraPlaceholder: {
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
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scannerFrame: { width: 200, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cameraLabel: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  cameraLabelText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, overflow: 'hidden',
  },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 19, paddingHorizontal: 10 },
  validateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  validateBtnDisabled: { opacity: 0.6 },
  validateBtnIcon: { fontSize: 18 },
  validateBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  retryBtn: {
    backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  retryBtnLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
    backgroundColor: '#FEF2F2', borderColor: '#FECACA',
  },
  errorBannerIcon: { fontSize: 20 },
  errorBannerText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
});
