import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import theme from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'light' | 'dark';
}

export default function Input({ label, error, style, variant = 'light', ...rest }: InputProps) {
  const isDark = variant === 'dark';

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isDark ? styles.inputDark : styles.inputLight,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : theme.colors.textDisabled}
        autoCapitalize="none"
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  labelDark: {
    color: theme.colors.textInverse,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
  },
  inputLight: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  inputDark: {
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textInverse,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
