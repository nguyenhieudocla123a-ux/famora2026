import { Platform } from 'react-native';

/**
 * Where the Famora backend runs.
 * - Android emulator: 10.0.2.2 is the emulator's alias for the computer it runs on.
 * - iOS simulator: shares the computer's network, so localhost works.
 * - A real phone needs the computer's LAN address instead (change here while testing).
 * Deliberately not tied to __DEV__: the APK used for testing bundles JS with --dev false and must still
 * reach the local backend. Phase 9 adds a per-environment build setting for the deployed API.
 */
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws';

/** Give up on a request after this long; the UI shows a retry. */
export const REQUEST_TIMEOUT_MS = 15_000;
