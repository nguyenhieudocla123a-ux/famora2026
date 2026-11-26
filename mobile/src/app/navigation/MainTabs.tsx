import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, House, type LucideIcon, UserRound, Users } from 'lucide-react-native';
import { colors, fonts } from '../../shared/theme';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { CalendarScreen } from '../../features/calendar/screens/CalendarScreen';
import { FamilyListScreen } from '../../features/family/screens/FamilyListScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = { color: string; size: number };
const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color, size }: TabIconProps) {
    return <Icon color={color} size={size} />;
  };

const HomeIcon = tabIcon(House);
const CalendarIcon = tabIcon(CalendarDays);
const FamiliesIcon = tabIcon(Users);
const ProfileIcon = tabIcon(UserRound);

/** Four tabs only, each with an icon and a text label. */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: 6 },
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
