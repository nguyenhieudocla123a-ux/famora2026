import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../../shared/theme';
import { useSession } from '../session/SessionContext';
import { SplashScreen } from '../../features/auth/screens/SplashScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { FamilyDetailScreen } from '../../features/family/screens/FamilyDetailScreen';
import { FamilyMembersScreen } from '../../features/family/screens/FamilyMembersScreen';
import { CreateFamilyScreen } from '../../features/family/screens/CreateFamilyScreen';
import { InviteMemberScreen } from '../../features/family/screens/InviteMemberScreen';
import { EventDetailScreen } from '../../features/calendar/screens/EventDetailScreen';
import { CreateEventScreen } from '../../features/calendar/screens/CreateEventScreen';
import { NotificationCenterScreen, renderMarkAllRead } from '../../features/notification/screens/NotificationCenterScreen';
import { SettingsScreen } from '../../features/profile/screens/SettingsScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** How long the splash shows while (in Phase 7) the stored refresh token is checked. */
const SPLASH_MS = 1200;

export function RootNavigator() {
  const { user } = useSession();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {booting ? (
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      ) : !user ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="FamilyDetail" component={FamilyDetailScreen} options={{ title: 'Gia đình' }} />
          <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} options={{ title: 'Thành viên' }} />
          <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} options={{ title: 'Tạo gia đình' }} />
          <Stack.Screen name="InviteMember" component={InviteMemberScreen} options={{ title: 'Mời người thân' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Chi tiết sự kiện' }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Thêm sự kiện' }} />
          <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: 'Thông báo', headerRight: renderMarkAllRead }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
