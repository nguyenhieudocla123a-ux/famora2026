import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider } from './src/app/session/SessionContext';
import { RootNavigator } from './src/app/navigation/RootNavigator';
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

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SessionProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

const styles = StyleSheet.create({ root: { flex: 1 } });
