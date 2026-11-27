import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

/** The Famora logo artwork supplied by the client (house, family, calendar, wordmark, tagline). */
const LOGO = require('../../../assets/brand/famora-logo.png');
/** The house-and-family part of the logo, without the wordmark. */
const EMBLEM = require('../../../assets/brand/famora-emblem.png');

const LOGO_RATIO = 1125 / 825;
const EMBLEM_RATIO = 786 / 536;

export function BrandLogo({ width, style }: { width: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={LOGO}
      style={[{ width, height: width / LOGO_RATIO }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Famora — Kết nối gia đình, sắp xếp cuộc sống"
    />
  );
}

export function BrandEmblem({ height, style }: { height: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={EMBLEM}
      style={[{ height, width: height * EMBLEM_RATIO }, style]}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
