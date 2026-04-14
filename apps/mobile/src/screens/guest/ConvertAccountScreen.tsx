import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuthStore } from '../../store/auth.store';
import { extractApiError } from '../../utils/error.utils';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * ConvertAccountScreen — modal permettant à un invité de créer un vrai compte.
 * Appelle PATCH /auth/convert avec le JWT invité courant.
 * En cas de succès, isGuest passe à false et la bannière disparaît.
 */
export default function ConvertAccountScreen({ visible, onClose }: Props) {
  const { convertAccount } = useAuthStore();

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

  const handleConvert = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await convertAccount(email.trim(), password);
      // isGuest devient false → la bannière disparaît, la modal se ferme
      onClose();
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

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirm('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Votre progression est conservée — seul un email et un mot de passe vous sont demandés.
          </Text>

          {errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="vous@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
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
            label="Sauvegarder ma progression"
            loading={loading}
            onPress={handleConvert}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  form: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 18,
    color: '#6B7280',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
