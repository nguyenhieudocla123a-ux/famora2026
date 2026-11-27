import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { AppText } from '../../../shared/ui';
import { colors, radius, spacing } from '../../../shared/theme';

/** A server-side error under a form (wrong password, no connection), announced to screen readers. */
export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <CircleAlert size={20} color={colors.dangerText} />
      <AppText variant="body" color={colors.dangerText} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  text: { flex: 1 },
});
