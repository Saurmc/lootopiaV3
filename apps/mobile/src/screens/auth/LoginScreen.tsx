import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { extractApiError } from '../../utils/error.utils';
import theme from '../../constants/theme';

interface LoginScreenProps {
  onGuestLogin: () => void;
  guestLoading: boolean;
  onGoToRegister: () => void;
}

export default function LoginScreen({ onGuestLogin, guestLoading, onGoToRegister }: LoginScreenProps) {
  const { login } = useAuth();
  const { consentGps, setConsentGps } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});
  const [gpsModalVisible, setGpsModalVisible] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "L'email est requis.";
    if (!password) next.password = 'Le mot de passe est requis.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const { status, message } = extractApiError(err);
      if (status === 401) {
        setErrors({ password: 'Email ou mot de passe incorrect.' });
      } else {
        setErrors({ global: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Roue crantée GPS — haut à droite */}
      <TouchableOpacity
        style={styles.gpsBtn}
        onPress={() => setGpsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.75)" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="vous@exemple.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            variant="dark"
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            variant="dark"
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={theme.colors.textInverse} />
              : <Text style={styles.btnPrimaryText}>Se connecter</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnGhost, guestLoading && styles.btnDisabled]}
            onPress={onGuestLogin}
            disabled={guestLoading}
            activeOpacity={0.85}
          >
            {guestLoading
              ? <ActivityIndicator color={theme.colors.textInverse} />
              : <Text style={styles.btnGhostText}>Continuer sans compte</Text>}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas encore inscrit ? </Text>
            <TouchableOpacity onPress={onGoToRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal GPS */}
      <Modal
        visible={gpsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGpsModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>Localisation GPS</Text>
            </View>
            <Text style={styles.modalDesc}>
              Nécessaire pour valider les étapes de chasse et afficher les chasses près de vous.
            </Text>
            <View style={styles.modalToggleRow}>
              <Text style={styles.modalToggleLabel}>
                {consentGps ? 'Activée' : 'Désactivée'}
              </Text>
              <Switch
                value={consentGps === true}
                onValueChange={setConsentGps}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={consentGps === true ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gpsBtn: {
    position: 'absolute',
    top: 52,
    right: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.xs,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoImage: {
    width: 380,
    height: 200,
  },
  form: {
    width: '100%',
    gap: theme.spacing.md,
  },
  globalError: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  globalErrorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
  },
  btnPrimary: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
  btnGhost: {
    height: 52,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGhostText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  registerLink: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  // Modal GPS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  modalDesc: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  modalToggleLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
});
