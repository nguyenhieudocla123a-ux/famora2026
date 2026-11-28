import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../../shared/api/config';

let configured = false;

function configure() {
  if (!configured) {
    // webClientId: the ID token is issued for Famora's web client, the audience the backend checks
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }
}

/** Why Google sign-in did not give a token, in words for the person holding the phone. */
export class GoogleSignInError extends Error {}

/**
 * Opens Google's account picker and returns the ID token for the chosen account, or null when the person
 * closed the picker (not an error: nothing to show). The token goes to POST /api/auth/google; the app never
 * reads anything else from it.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) {
      return null; // cancelled
    }
    if (!res.data.idToken) {
      throw new GoogleSignInError('Google không trả về mã xác thực. Vui lòng thử lại.');
    }
    return res.data.idToken;
  } catch (e) {
    if (e instanceof GoogleSignInError) {
      throw e;
    }
    if (isErrorWithCode(e)) {
      switch (e.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return null;
        case statusCodes.IN_PROGRESS:
          return null; // a second tap while the picker is already open
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new GoogleSignInError('Máy này chưa có Google Play services nên chưa đăng nhập bằng Google được.');
      }
    }
    // DEVELOPER_ERROR (10) lands here: package name / SHA-1 / client ID not matching Google Cloud
    throw new GoogleSignInError('Không đăng nhập được bằng Google. Vui lòng thử lại sau.');
  }
}

/** Forget the chosen Google account, so the next sign-in shows the picker again. Never fails. */
export async function forgetGoogleAccount(): Promise<void> {
  try {
    configure();
    await GoogleSignin.signOut();
  } catch {
    // not signed in with Google, or no Play services: nothing to forget
  }
}
