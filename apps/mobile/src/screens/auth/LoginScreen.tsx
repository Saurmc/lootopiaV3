import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { extractApiError } from '../../utils/error.utils';
import theme from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});

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
      // RootNavigator bascule automatiquement vers AppNavigator dès que isAuthenticated passe à true
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>Lootopia</Text>
          <Text style={styles.logoSubtitle}>Explorez. Découvrez. Gagnez.</Text>
        </View>

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

          <Button
            label="Se connecter"
            loading={loading}
            onPress={handleLogin}
            style={styles.button}
          />
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
    marginBottom: theme.spacing.xxl,
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
});
