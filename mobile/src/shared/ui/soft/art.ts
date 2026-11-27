import type { ImageSourcePropType } from 'react-native';

/** Illustrations cut from the Famora brand board. */
export const art = {
  heroFamily: require('../../../assets/illustrations/hero-family.png') as ImageSourcePropType, // 984x852
  familySofa: require('../../../assets/illustrations/family-sofa.png') as ImageSourcePropType, // 956x636
  emptyCalendar: require('../../../assets/illustrations/empty-calendar.png') as ImageSourcePropType, // 352x272
};

export const avatarArt = {
  bo: require('../../../assets/avatars/bo.png') as ImageSourcePropType,
  me: require('../../../assets/avatars/me.png') as ImageSourcePropType,
  ong: require('../../../assets/avatars/ong.png') as ImageSourcePropType,
  ba: require('../../../assets/avatars/ba.png') as ImageSourcePropType,
  conTrai: require('../../../assets/avatars/con-trai.png') as ImageSourcePropType,
  conGai: require('../../../assets/avatars/con-gai.png') as ImageSourcePropType,
};
export type AvatarArt = keyof typeof avatarArt;

export const stickers = {
  yeah: require('../../../assets/stickers/yeah.png') as ImageSourcePropType,
  tuyetVoi: require('../../../assets/stickers/tuyet-voi.png') as ImageSourcePropType,
  yeuThuong: require('../../../assets/stickers/yeu-thuong.png') as ImageSourcePropType,
  coLen: require('../../../assets/stickers/co-len.png') as ImageSourcePropType,
  om: require('../../../assets/stickers/om.png') as ImageSourcePropType,
  nguNgon: require('../../../assets/stickers/ngu-ngon.png') as ImageSourcePropType,
  good: require('../../../assets/stickers/good.png') as ImageSourcePropType,
  baVui: require('../../../assets/stickers/ba-vui.png') as ImageSourcePropType,
};
export type StickerName = keyof typeof stickers;

/**
 * Which illustrated face stands in for a person until real photos arrive (Phase 7):
 * read from the family nickname first, then from the Vietnamese middle name.
 */
export function avatarFor(fullName: string, nickname?: string): AvatarArt {
  const n = (nickname ?? '').toLowerCase();
  if (n.startsWith('ông')) {
    return 'ong';
  }
  if (n.startsWith('bà')) {
    return 'ba';
  }
  if (n.startsWith('bé') || n.startsWith('cháu') || n.startsWith('em')) {
    return / thị /i.test(` ${fullName} `) ? 'conGai' : 'conTrai';
  }
  if (n.startsWith('mẹ') || n.startsWith('chị') || n.startsWith('cô') || n.startsWith('dì')) {
    return 'me';
  }
  if (n.length > 0) {
    return 'bo';
  }
  return / thị /i.test(` ${fullName} `) ? 'me' : 'bo';
}
