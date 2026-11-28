import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../../shared/theme';
import { useAppSelector } from '../store';
import { SplashScreen } from '../../features/auth/screens/SplashScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { FamilyDetailScreen } from '../../features/family/screens/FamilyDetailScreen';
import { FamilyMembersScreen } from '../../features/family/screens/FamilyMembersScreen';
import { CreateFamilyScreen } from '../../features/family/screens/CreateFamilyScreen';
import { InviteMemberScreen } from '../../features/family/screens/InviteMemberScreen';
import { AddPersonScreen } from '../../features/family/screens/AddPersonScreen';
import { EventDetailScreen } from '../../features/calendar/screens/EventDetailScreen';
import { CreateEventScreen } from '../../features/calendar/screens/CreateEventScreen';
import { NotificationCenterScreen, renderMarkAllRead } from '../../features/notification/screens/NotificationCenterScreen';
import { SettingsScreen } from '../../features/profile/screens/SettingsScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The splash stays at least this long, so a fast start does not flash. */
const SPLASH_MS = 1200;

export function RootNavigator() {
  const status = useAppSelector(s => s.auth.status);
  const [minSplash, setMinSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMinSplash(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // while booting, the stored refresh token is being exchanged for a session
  const booting = minSplash || status === 'booting';
  const signedIn = status === 'signedIn';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {booting ? (
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      ) : !signedIn ? (
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
          <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Thêm người thân' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Chi tiết sự kiện' }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Thêm sự kiện' }} />
          <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: 'Thông báo', headerRight: renderMarkAllRead }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
