import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
 */
export default function ConvertAccountScreen({ visible, onClose }: Props) {
  const { convertAccount } = useAuthStore();
  const { t } = useTranslation();

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
    if (!email.trim()) next.email = t('convert.emailRequired');
    if (!password) next.password = t('convert.passwordRequired');
    else if (password.length < 8) next.password = t('convert.passwordMin');
    if (!confirm) next.confirm = t('convert.confirmRequired');
    else if (confirm !== password) next.confirm = t('convert.confirmMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConvert = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await convertAccount(email.trim(), password);
      onClose();
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
          <View style={styles.header}>
            <Text style={styles.title}>{t('convert.title')}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{t('convert.subtitle')}</Text>

          {errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <Input
            label={t('convert.email')}
            placeholder={t('convert.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />

          <Input
            label={t('convert.password')}
            placeholder={t('convert.passwordPlaceholder')}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <Input
            label={t('convert.confirmPassword')}
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
          />

          <Button
            label={t('convert.submit')}
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
