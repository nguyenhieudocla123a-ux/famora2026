import React from 'react';
import { StyleSheet, View } from 'react-native';
import { House } from 'lucide-react-native';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

/** App mark: a house in a gold-rimmed brown tile, with the name set in the serif face. */
export function BrandMark({ size = 72, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.wrap} accessible accessibilityLabel="FamilyHub">
      <View style={[styles.tile, { width: size, height: size, borderRadius: radius.lg + 4 }]}>
        <House size={size * 0.5} color={colors.highlight} strokeWidth={1.75} />
      </View>
      {showName && (
        <AppText variant="display" color={colors.primary}>
          FamilyHub
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  tile: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
