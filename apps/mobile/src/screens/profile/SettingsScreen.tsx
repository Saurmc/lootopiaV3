import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { profileService } from '../../services/profile.service';
import { useAuthStore } from '../../store/auth.store';
import theme from '../../constants/theme';

type SettingsNavProp = NativeStackNavigationProp<AppStackParamList, 'Settings'>;

/**
 * SettingsScreen — US61
 * Permet de modifier le pseudo, l'avatar (galerie photo) et le consentement GPS.
 */
export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { consentGps, setConsentGps } = useAuthStore();

  const [pseudo, setPseudo] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setPseudo(profile.pseudo ?? '');
      setAvatarUri(profile.avatar_url ?? null);
    }
  }, [profile]);

  async function handlePickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire pour changer l'avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      const uploadedUrl = await profileService.uploadAvatar(
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
      );
      setAvatarUri(uploadedUrl);
      updateProfile(
        { avatar_url: uploadedUrl },
        { onError: () => Alert.alert('Erreur', "Impossible de mettre à jour l'avatar.") },
      );
    } catch {
      Alert.alert('Erreur', "L'upload a échoué. Vérifiez votre connexion.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleRemoveAvatar() {
    Alert.alert('Supprimer l\'avatar', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          setAvatarUri(null);
          updateProfile({ avatar_url: undefined });
        },
      },
    ]);
  }

  function handleSavePseudo() {
    const trimmed = pseudo.trim();
    if (trimmed === (profile?.pseudo ?? '')) {
      Alert.alert('Aucune modification', 'Le pseudo n\'a pas changé.');
      return;
    }
    updateProfile(
      { pseudo: trimmed || undefined },
      {
        onSuccess: () => Alert.alert('Succès', 'Pseudo mis à jour.'),
        onError: () => Alert.alert('Erreur', 'La mise à jour a échoué.'),
      },
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const displayInitials = (profile?.pseudo ?? profile?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Avatar ── */}
          <Text style={styles.sectionTitle}>Avatar</Text>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} disabled={avatarUploading}>
              <View style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{displayInitials}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  {avatarUploading
                    ? <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    : <Ionicons name="camera" size={14} color={theme.colors.textInverse} />
                  }
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.avatarInfo}>
              <Text style={styles.avatarInfoTitle}>Photo de profil</Text>
              <Text style={styles.avatarInfoSub}>
                {avatarUploading ? 'Upload en cours…' : 'Touchez la photo pour choisir depuis la galerie'}
              </Text>
              {avatarUri && !avatarUploading && (
                <TouchableOpacity onPress={handleRemoveAvatar}>
                  <Text style={styles.avatarRemove}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Pseudo ── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleTop]}>Pseudo</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput
                style={styles.input}
                value={pseudo}
                onChangeText={setPseudo}
                placeholder="Votre pseudo"
                placeholderTextColor={theme.colors.textDisabled}
                maxLength={50}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
            onPress={handleSavePseudo}
            activeOpacity={0.8}
            disabled={isPending}
          >
            {isPending
              ? <ActivityIndicator color={theme.colors.textInverse} size="small" />
              : <Text style={styles.saveBtnText}>Enregistrer</Text>}
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
                onValueChange={setConsentGps}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={consentGps === true ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* ── Sécurité ── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleTop]}>Sécurité</Text>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Security')} activeOpacity={0.75}>
            <View style={styles.navRow}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.navRowText}>Mot de passe et suppression du compte</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {profile && (
            <View style={styles.infoCard}>
              <Text style={styles.infoRow}><Text style={styles.infoLabel}>Email : </Text>{profile.email ?? '—'}</Text>
              <Text style={styles.infoRow}>
                <Text style={styles.infoLabel}>Membre depuis : </Text>
                {new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceElevated },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },

  sectionTitle: { ...theme.typography.caption, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitleTop: { marginTop: theme.spacing.sm },

  avatarSection: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 72, height: 72, borderRadius: theme.borderRadius.full, borderWidth: 2, borderColor: theme.colors.border },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.gradientStart, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { ...theme.typography.h3, color: theme.colors.textInverse },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.surface,
  },
  avatarInfo: { flex: 1, gap: theme.spacing.xs },
  avatarInfoTitle: { ...theme.typography.label, color: theme.colors.text },
  avatarInfoSub: { ...theme.typography.caption, color: theme.colors.textSecondary, lineHeight: 16 },
  avatarRemove: { ...theme.typography.caption, color: theme.colors.error, fontWeight: '600', marginTop: 2 },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.borderLight, overflow: 'hidden', ...theme.shadows.card },
  fieldRow: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: 4 },
  label: { ...theme.typography.caption, fontWeight: '600', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { ...theme.typography.body, color: theme.colors.text, paddingVertical: theme.spacing.xs, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },

  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl, paddingVertical: theme.spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontSize: 15 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: theme.spacing.md },
  toggleLeft: { flex: 1, gap: 3 },
  toggleLabel: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  toggleSub: { ...theme.typography.caption, color: theme.colors.textSecondary, lineHeight: 17 },

  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  navRowText: { flex: 1, ...theme.typography.body, fontWeight: '500', color: theme.colors.text },

  infoCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.borderLight, padding: theme.spacing.md, gap: theme.spacing.sm },
  infoRow: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  infoLabel: { fontWeight: '600', color: theme.colors.text },
});
