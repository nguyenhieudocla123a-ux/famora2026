import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { AppText, Avatar } from '../../../shared/ui';
import { Candle, FallingHearts } from '../../../shared/ui/family/Ambient';
import { art } from '../../../shared/ui/soft/art';
import { colors, fonts, iconSize, moods, radius, shadow, spacing } from '../../../shared/theme';
import type { DayMood } from '../../../shared/theme';
import type { FamilyMember } from '../../../shared/types/domain';

/** Top and bottom of the hero's gradient for each kind of day. */
const SKY: Record<DayMood, [string, string]> = {
  ordinary: ['#CFE3FF', '#EEF6FF'],
  birthday: ['#FFE3A6', '#FFF6E2'],
  wedding: ['#FFD5D0', '#FFF1EF'],
  holiday: ['#FFD9B3', '#FFF3E6'],
  memorial: ['#3E4C66', '#56647D'],
};

const MOOD_LINE: Record<DayMood, string> = {
  ordinary: 'Một ngày bình yên bên nhau',
  birthday: 'Hôm nay có sinh nhật trong nhà',
  wedding: 'Hôm nay là ngày cưới của nhà mình',
  holiday: 'Hôm nay là ngày lễ',
  memorial: 'Hôm nay là ngày giỗ, cả nhà cùng nhớ',
};

interface Props {
  mood: DayMood;
  familyName: string;
  memberCount: number;
  members: FamilyMember[];
  onSwitchFamily: () => void;
  onOpenMembers: () => void;
}

/** Card height, and the members strip along its bottom. */
const HEIGHT = 214;
const STRIP = 58;

/**
 * The family card at the top of Home: the family's name and faces on the left, the brand's
 * family illustration on the right, its sky tinted by the day (hearts on festive days, a candle on a giỗ).
 */
export function FamilyHero({ mood, familyName, memberCount, members, onSwitchFamily, onOpenMembers }: Props) {
  const [w, setW] = useState(360);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const m = moods[mood];
  const dark = mood === 'memorial';
  const ink = dark ? m.onBand : colors.text;
  const muted = dark ? m.onBandMuted : colors.textSecondary;
  const [top, bottom] = SKY[mood];
  const artH = HEIGHT - STRIP - 4;
  const artW = (artH * 984) / 852;
  const faces = members.slice(0, 4);

  return (
    <View style={[styles.card, shadow.card]} onLayout={onLayout}>
      <Svg style={StyleSheet.absoluteFill} width={w} height={HEIGHT} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={HEIGHT} fill="url(#hero)" />
      </Svg>

      {m.effect === 'petals' && <FallingHearts color={m.petal} height={HEIGHT} count={6} />}
      {dark ? (
        <View style={styles.candle} pointerEvents="none">
          <Candle size={40} />
        </View>
      ) : (
        <Image
          source={art.heroFamily}
          style={[styles.art, { width: artW, height: artH }]}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}

      <View style={[styles.text, { width: dark ? w - 100 : w - artW + 8 }]}>
        <Pressable onPress={onSwitchFamily} accessibilityRole="button" accessibilityLabel={`Gia đình đang xem: ${familyName}. Đổi gia đình`} hitSlop={8} style={styles.nameRow}>
          <AppText style={[styles.name, { color: ink }]} numberOfLines={2}>
            {familyName}
          </AppText>
          <ChevronDown size={iconSize.sm} color={muted} />
        </Pressable>
        <AppText variant="caption" color={muted} numberOfLines={2}>
          {MOOD_LINE[mood]}
        </AppText>
      </View>

      {/* members strip: a frosted band across the bottom, clear of the illustration */}
      <Pressable
        onPress={onOpenMembers}
        accessibilityRole="button"
        accessibilityLabel={`Xem ${memberCount} thành viên`}
        style={({ pressed }) => [styles.strip, dark && styles.stripDark, pressed && styles.stripPressed]}
      >
        <View style={styles.stack}>
          {faces.map((f, i) => (
            <View key={f.id} style={[styles.face, i > 0 && styles.overlap, { zIndex: 10 - i }]}>
              <Avatar name={f.fullName} nickname={f.nickname} size={34} ring />
            </View>
          ))}
        </View>
        <AppText variant="label" color={dark ? m.onBand : colors.primaryDeep} style={styles.flex}>
          {memberCount} thành viên
        </AppText>
        <ChevronRight size={iconSize.sm} color={dark ? m.onBand : colors.primaryDeep} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: HEIGHT, borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: colors.sky },
  art: { position: 'absolute', right: -4, bottom: STRIP },
  candle: { position: 'absolute', right: 36, top: 36 },
  text: { height: HEIGHT - STRIP, paddingLeft: spacing.xl, paddingRight: spacing.sm, gap: spacing.xs, justifyContent: 'center' },
  flex: { flex: 1 },
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: STRIP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  stripDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  stripPressed: { opacity: 0.8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, flexShrink: 1 },
  stack: { flexDirection: 'row' },
  face: { borderRadius: 20 },
  overlap: { marginLeft: -12 },
});
