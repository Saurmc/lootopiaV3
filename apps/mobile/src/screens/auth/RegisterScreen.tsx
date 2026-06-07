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
import { extractApiError } from '../../utils/error.utils';
import theme from '../../constants/theme';

interface RegisterScreenProps {
  onBack?: () => void;
}

export default function RegisterScreen({ onBack }: RegisterScreenProps) {
  const { register } = useAuth();

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
    if (!pseudo.trim()) next.pseudo = 'Le pseudo est requis.';
    else if (pseudo.trim().length < 2) next.pseudo = 'Minimum 2 caractères.';
    if (!email.trim()) next.email = "L'email est requis.";
    if (!password) next.password = 'Le mot de passe est requis.';
    else if (password.length < 8) next.password = 'Minimum 8 caractères.';
    if (!confirm) next.confirm = 'Veuillez confirmer le mot de passe.';
    else if (confirm !== password) next.confirm = 'Les mots de passe ne correspondent pas.';
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
        setErrors({ email: 'Cet email est déjà utilisé.' });
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
          <Text style={styles.logoSubtitle}>Créez votre compte</Text>
        </View>

        <View style={styles.form}>
          {errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <Input
            label="Pseudo"
            placeholder="Votre nom d'aventurier"
            value={pseudo}
            onChangeText={setPseudo}
            error={errors.pseudo}
            variant="dark"
            autoCapitalize="words"
            maxLength={50}
          />

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
            placeholder="Minimum 8 caractères"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            variant="dark"
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            variant="dark"
          />

          <Button
            label="Créer mon compte"
            loading={loading}
            onPress={handleRegister}
            style={styles.button}
          />

          {onBack && (
            <View style={styles.backRow}>
              <Text style={styles.backText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                <Text style={styles.backLink}>Se connecter</Text>
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
