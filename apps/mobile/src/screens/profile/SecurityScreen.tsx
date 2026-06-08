import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { profileService } from '../../services/profile.service';
import { useAuthStore } from '../../store/auth.store';

// ─── SecurityScreen ───────────────────────────────────────────────────────────

/**
 * SecurityScreen — US62
 * Changement de mot de passe, déconnexion et suppression de compte.
 */
export default function SecurityScreen() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Changement de mot de passe
  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert(t('security.missingFields'), t('security.missingFieldsMsg'));
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert(t('security.passwordTooShort'), t('security.passwordTooShortMsg'));
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert(t('security.mismatch'), t('security.mismatchMsg'));
      return;
    }

    setPwdLoading(true);
    try {
      await profileService.changePassword(currentPwd, newPwd, confirmPwd);
      Alert.alert(t('common.success'), t('security.successMsg'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        Alert.alert(t('security.wrongPassword'), t('security.wrongPasswordMsg'));
      } else {
        Alert.alert(t('common.error'), t('security.errorMsg'));
      }
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Déconnexion
  function handleLogout() {
    Alert.alert(
      t('security.logoutTitle'),
      t('security.logoutMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.logoutTitle'),
            style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  }

  // ── Suppression de compte
  function handleDeleteAccount() {
    Alert.alert(
      t('security.deleteAccount'),
      t('security.deleteMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.deleteConfirm'),
            style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await profileService.deleteAccount();
              await logout();
            } catch {
              setDeleteLoading(false);
              Alert.alert(t('common.error'), t('security.deleteError'));
            }
          },
        },
      ],
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
          {/* ── Mot de passe ── */}
          <Text style={styles.sectionTitle}>{t('security.changePassword')}</Text>

          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>{t('security.currentPassword')}</Text>
              <TextInput
                style={styles.input}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <Text style={styles.label}>{t('security.newPassword')}</Text>
              <TextInput
                style={styles.input}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder={t('security.newPasswordPlaceholder')}
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <Text style={styles.label}>{t('security.confirmNewPassword')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, pwdLoading && styles.btnDisabled]}
            onPress={handleChangePassword}
            activeOpacity={0.8}
            disabled={pwdLoading}
          >
            {pwdLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('security.submit')}</Text>
            )}
          </TouchableOpacity>

          {/* ── Session ── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleTop]}>{t('security.session')}</Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>{t('security.logoutBtn')}</Text>
          </TouchableOpacity>

          {/* ── Zone de danger ── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleTop, styles.dangerTitle]}>
            {t('security.dangerZone')}
          </Text>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerDescription}>
              {t('security.dangerDesc')}
            </Text>
            <TouchableOpacity
              style={[styles.deleteBtn, deleteLoading && styles.btnDisabled]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>{t('security.deleteBtn')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 12 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleTop: { marginTop: 8 },
  dangerTitle: { color: '#DC2626' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  primaryBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    gap: 12,
  },
  dangerDescription: { fontSize: 13, color: '#7F1D1D', lineHeight: 19 },
  deleteBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
