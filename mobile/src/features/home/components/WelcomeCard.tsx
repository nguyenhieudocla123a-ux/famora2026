import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { KeyRound, Plus } from 'lucide-react-native';
import { AppText, Button } from '../../../shared/ui';
import { art } from '../../../shared/ui/soft/art';
import { colors, fonts, radius, shadow, spacing } from '../../../shared/theme';

interface Props {
  onCreate: () => void;
  onJoin: () => void;
}

/** Shown on Home to someone who belongs to no family yet: the two ways in. */
export function WelcomeCard({ onCreate, onJoin }: Props) {
  return (
    <View style={[styles.card, shadow.card]}>
      <Image source={art.familySofa} style={styles.art} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no" />
      <View style={styles.body}>
        <AppText style={styles.title} accessibilityRole="header">
          Chào mừng đến Famora
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Tạo gia đình rồi mời người thân, hoặc nhập mã mời mà người nhà đã gửi cho bạn.
        </AppText>
        <Button label="Tạo gia đình" icon={Plus} onPress={onCreate} fullWidth />
        <Button label="Tôi có mã mời" icon={KeyRound} variant="secondary" onPress={onJoin} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, backgroundColor: colors.surface, overflow: 'hidden' },
  art: { width: '100%', height: 190 },
  body: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.text },
});
