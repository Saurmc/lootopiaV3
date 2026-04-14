import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/auth.store';

// ─── SettingsScreen ───────────────────────────────────────────────────────────

/**
 * SettingsScreen — US61
 * Permet de modifier le pseudo, l'URL d'avatar et le consentement GPS.
 */
export default function SettingsScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { consentGps, setConsentGps } = useAuthStore();

  const [pseudo, setPseudo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Initialise les champs dès que le profil est chargé
  useEffect(() => {
    if (profile) {
      setPseudo(profile.pseudo ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  function handleSave() {
    const payload: { pseudo?: string; avatar_url?: string } = {};

    const trimmedPseudo = pseudo.trim();
    const trimmedAvatar = avatarUrl.trim();

    if (trimmedPseudo !== (profile?.pseudo ?? '')) {
      payload.pseudo = trimmedPseudo || undefined;
    }
    if (trimmedAvatar !== (profile?.avatar_url ?? '')) {
      payload.avatar_url = trimmedAvatar || undefined;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('Aucune modification', 'Aucun champ n\'a été modifié.');
      return;
    }

    updateProfile(payload, {
      onSuccess: () => Alert.alert('Succès', 'Profil mis à jour.'),
      onError: () => Alert.alert('Erreur', 'La mise à jour a échoué. Vérifiez les champs saisis.'),
    });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profil ── */}
          <Text style={styles.sectionTitle}>Profil</Text>

          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput
                style={styles.input}
                value={pseudo}
                onChangeText={setPseudo}
                placeholder="Votre pseudo"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Avatar (URL)</Text>
              <TextInput
                style={styles.input}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>

          {/* ── Confidentialité ── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleTop]}>Confidentialité</Text>

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleLabel}>Localisation GPS</Text>
                <Text style={styles.toggleSub}>
                  Autoriser l'application à accéder à votre position pour valider les étapes GPS.
                </Text>
              </View>
              <Switch
                value={consentGps === true}
                onValueChange={(val) => setConsentGps(val)}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={consentGps === true ? '#3B82F6' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Informations compte */}
          {profile && (
            <View style={styles.infoCard}>
              <Text style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email : </Text>
                {profile.email ?? '—'}
              </Text>
              <Text style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rôle : </Text>
                {profile.role}
              </Text>
              <Text style={styles.infoRow}>
                <Text style={styles.infoLabel}>Membre depuis : </Text>
                {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 12 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitleTop: { marginTop: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  fieldRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  saveBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleLeft: { flex: 1, gap: 3 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  toggleSub: { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 6,
  },
  infoRow: { fontSize: 13, color: '#374151' },
  infoLabel: { fontWeight: '600', color: '#111827' },
});
