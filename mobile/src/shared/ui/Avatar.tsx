import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { AppText } from './AppText';

const tints = ['#EFE4D2', '#F6E1DE', '#FCEFD3', '#E1EDE3', '#DDEBEE'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  const first = parts.length > 1 ? parts[0] : '';
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

/** Initials avatar; photo avatars arrive with the upload API in Phase 7. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const tint = tints[name.length % tints.length];
  return (
    <View
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <AppText variant="label" color={colors.primary} style={{ fontSize: size * 0.36, lineHeight: size * 0.5 }}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
