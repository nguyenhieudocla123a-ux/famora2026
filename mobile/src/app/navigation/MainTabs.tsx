import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, House, type LucideIcon, UserRound, Users } from 'lucide-react-native';
import { colors, fonts, shadow, spacing } from '../../shared/theme';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { CalendarScreen } from '../../features/calendar/screens/CalendarScreen';
import { FamilyListScreen } from '../../features/family/screens/FamilyListScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = { color: string; size: number; focused: boolean };
/** The active tab sits in a soft blue pill. */
const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color, size, focused }: TabIconProps) {
    return (
      <View style={[styles.pill, focused && styles.pillOn]}>
        <Icon color={color} size={size} strokeWidth={focused ? 2.4 : 2} />
      </View>
    );
  };

const HomeIcon = tabIcon(House);
const CalendarIcon = tabIcon(CalendarDays);
const FamiliesIcon = tabIcon(Users);
const ProfileIcon = tabIcon(UserRound);

/** Height of the tappable part of the tab bar, above the system gesture area. */
const TAB_CONTENT_HEIGHT = 64;

/** Four tabs, icon + label always. Icons and labels sit fully above the gesture/home-indicator area. */
export function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...shadow.float,
          height: TAB_CONTENT_HEIGHT + insets.bottom + spacing.sm,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 13 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ', tabBarIcon: HomeIcon }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Lịch', tabBarIcon: CalendarIcon }} />
      <Tab.Screen name="Families" component={FamilyListScreen} options={{ title: 'Gia đình', tabBarIcon: FamiliesIcon }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarIcon: ProfileIcon }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.primarySoft },
});
