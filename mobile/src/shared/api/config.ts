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

/**
 * Google sign-in: the OAuth "Web application" client ID. The Google SDK asks for an ID token issued for it,
 * and the backend accepts only tokens with this audience (its GOOGLE_WEB_CLIENT_ID). A client ID is public
 * (it ships inside every app), unlike a client secret, which Famora never uses.
 */
export const GOOGLE_WEB_CLIENT_ID = '934459874749-n3vov2oa4lsc7tskn15q0t847dkna8tm.apps.googleusercontent.com';

export const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws';

/** Give up on a request after this long; the UI shows a retry. */
export const REQUEST_TIMEOUT_MS = 15_000;
