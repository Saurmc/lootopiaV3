import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * GpsConsentModal — popup demandant le consentement de localisation.
 * Affiché immédiatement après une connexion en mode invité.
 */
export default function GpsConsentModal({ visible, onAccept, onDecline }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.title}>Autoriser la localisation</Text>
          <Text style={styles.body}>
            Autorisez la localisation pour découvrir les chasses au trésor près de vous et valider
            vos étapes GPS.
          </Text>
          <TouchableOpacity style={styles.btnAccept} onPress={onAccept} activeOpacity={0.8}>
            <Text style={styles.btnAcceptLabel}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDecline} onPress={onDecline} activeOpacity={0.8}>
            <Text style={styles.btnDeclineLabel}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnAccept: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnAcceptLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDecline: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnDeclineLabel: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
});
