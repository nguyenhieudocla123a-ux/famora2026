import * as Keychain from 'react-native-keychain';

/**
 * Where the tokens live.
 * - The access token (15 minutes) stays in memory only: lost on restart, which is fine.
 * - The refresh token (14 days) goes to the OS secure store (Android Keystore / iOS Keychain), never to
 *   AsyncStorage, so other apps and backups cannot read it.
 */
const SERVICE = 'com.famora.refresh';

let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,
  setAccess: (token: string | null) => {
    accessToken = token;
  },

  async getRefresh(): Promise<string | null> {
    try {
      const found = await Keychain.getGenericPassword({ service: SERVICE });
      return found ? found.password : null;
    } catch {
      return null; // an unreadable store just means "signed out"
    }
  },

  async setRefresh(token: string): Promise<void> {
    await Keychain.setGenericPassword('famora', token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  },

  async clear(): Promise<void> {
    accessToken = null;
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch {
      // nothing stored: nothing to clear
    }
  },
};
