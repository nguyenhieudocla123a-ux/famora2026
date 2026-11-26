import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputInstance, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, touch, typography } from '../theme';
import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled input: the label is always visible and the error sits right under its field. */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextFieldInner(
  { label, error, hint, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;
  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.text}>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        multiline={multiline}
        maxFontSizeMultiplier={1.6}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { borderColor },
          focused || error ? styles.inputActive : null,
          multiline && styles.multiline,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: touch.minHeight + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputActive: { borderWidth: 2 },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
});
