import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store, useAppDispatch } from './src/app/store';
import { SessionProvider } from './src/app/session/SessionContext';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { bootstrap, sessionExpired } from './src/features/auth/authSlice';
import { apiClient } from './src/shared/api/client';
import { colors } from './src/shared/theme';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

/** Starts the session once: restore it from the secure store, and listen for it expiring. */
function SessionBoot() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    apiClient.onSessionExpired(() => dispatch(sessionExpired()));
    dispatch(bootstrap());
  }, [dispatch]);
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <SessionBoot />
          <SessionProvider>
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          </SessionProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

export default App;

const styles = StyleSheet.create({ root: { flex: 1 } });
