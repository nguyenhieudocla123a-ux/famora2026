import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { avatarArt, avatarFor, type AvatarArt } from './soft/art';

interface Props {
  name: string;
  /** Family nickname ("Bố", "Bà nội"), used to pick the right face. */
  nickname?: string;
  /** Force a face, e.g. for the signed-in user. */
  face?: AvatarArt;
  size?: number;
  /** White ring, for avatars that overlap in a stack. */
  ring?: boolean;
}

/** Illustrated family face; real photos replace it with the upload API in Phase 7. */
export function Avatar({ name, nickname, face, size = 44, ring = false }: Props) {
  const src = avatarArt[face ?? avatarFor(name, nickname)];
  const box = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.base, box, ring && styles.ring]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Image source={src} style={box} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: colors.primarySoft },
  ring: { borderWidth: 2.5, borderColor: colors.surface },
});
