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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
    global?: string;
  }>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
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
      await register(email.trim(), password);
      // RootNavigator bascule automatiquement vers AppNavigator
    } catch (err: unknown) {
      const { status, message } = extractApiError(err);
      if (status === 409) {
        setErrors({ email: 'Cet email est déjà utilisé.' });
      } else if (status === 400) {
        setErrors({ global: message });
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
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Créer un compte</Text>

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
        />

        <Input
          label="Mot de passe"
          placeholder="Minimum 8 caractères"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Input
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
        />

        <Button
          label="Créer mon compte"
          loading={loading}
          onPress={handleRegister}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  globalError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  globalErrorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
});
