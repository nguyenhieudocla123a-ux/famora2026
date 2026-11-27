import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '../../../shared/ui/family/Brand';
import { SkyBackground } from '../../../shared/ui/soft/SkyBackground';
import { Hills } from '../../../shared/ui/soft/Hills';
import { Appear } from '../../../shared/ui/soft/Appear';
import { colors, spacing } from '../../../shared/theme';

export function SplashScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <SkyBackground height={560} />
      <Hills height={170} />
      <View style={styles.center}>
        <Appear>
          <BrandLogo width={270} />
        </Appear>
      </View>
      <ActivityIndicator color={colors.primary} style={styles.loader} accessibilityLabel="Đang mở Famora" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: 120 },
  loader: { marginBottom: 190 },
});
