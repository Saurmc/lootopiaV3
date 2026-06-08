import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { extractApiError } from '../../utils/error.utils';
import theme from '../../constants/theme';

interface RegisterScreenProps {
  onBack?: () => void;
}

export default function RegisterScreen({ onBack }: RegisterScreenProps) {
  const { register } = useAuth();
  const { t } = useTranslation();

  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    pseudo?: string;
    email?: string;
    password?: string;
    confirm?: string;
    global?: string;
  }>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!pseudo.trim()) next.pseudo = t('register.pseudoRequired');
    else if (pseudo.trim().length < 2) next.pseudo = t('register.pseudoMin');
    if (!email.trim()) next.email = t('register.pseudoRequired'.replace('pseudo', 'email')) || t('auth.emailRequired');
    if (!password) next.password = t('auth.passwordRequired');
    else if (password.length < 8) next.password = t('auth.passwordMin');
    if (!confirm) next.confirm = t('register.confirmRequired');
    else if (confirm !== password) next.confirm = t('register.confirmMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register(email.trim(), password, pseudo.trim());
      // RootNavigator bascule automatiquement vers AppNavigator
    } catch (err: unknown) {
      const { status, message } = extractApiError(err);
      if (status === 409) {
        setErrors({ email: t('register.emailUsed') });
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>{t('register.title')}</Text>
          <Text style={styles.logoSubtitle}>{t('register.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          {errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <Input
            label={t('register.pseudo')}
            placeholder={t('register.pseudoPlaceholder')}
            value={pseudo}
            onChangeText={setPseudo}
            error={errors.pseudo}
            variant="dark"
            autoCapitalize="words"
            maxLength={50}
          />

          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            variant="dark"
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            variant="dark"
          />

          <Input
            label={t('register.confirmPassword')}
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            variant="dark"
          />

          <Button
            label={t('register.submit')}
            loading={loading}
            onPress={handleRegister}
            style={styles.button}
          />

          {onBack && (
            <View style={styles.backRow}>
              <Text style={styles.backText}>{t('auth.alreadyAccount')}</Text>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                <Text style={styles.backLink}>{t('auth.login')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoText: {
    ...theme.typography.logoFont,
    color: theme.colors.textInverse,
    fontStyle: 'italic',
  },
  logoSubtitle: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.65)',
    marginTop: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
  },
  globalError: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  globalErrorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  backText: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  backLink: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
