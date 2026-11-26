import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { IsoDate } from '../../shared/types/domain';

export type MainTabParamList = {
  Home: undefined;
  Calendar: { date?: IsoDate } | undefined;
  Families: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  FamilyDetail: { familyId: string };
  FamilyMembers: { familyId: string };
  CreateFamily: undefined;
  InviteMember: { familyId: string };
  EventDetail: { eventId: string; date: IsoDate };
  CreateEvent: { date?: IsoDate } | undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
