import { configureStore } from '@reduxjs/toolkit';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authReducer, googleSignIn } from '../src/features/auth/authSlice';
import { getGoogleIdToken } from '../src/features/auth/google';
import { apiClient } from '../src/shared/api/client';

const makeStore = () => configureStore({ reducer: { auth: authReducer } });

afterEach(() => jest.restoreAllMocks());

test('the ID token from Google goes to /api/auth/google and the user is signed in', async () => {
  const post = jest.spyOn(apiClient.http, 'post').mockResolvedValue({
    data: { accessToken: 'a', tokenType: 'Bearer', expiresAt: '', refreshToken: 'r', refreshExpiresAt: '' },
  });
  jest.spyOn(apiClient.http, 'get').mockResolvedValue({
    data: { id: 7, email: 'mai@gmail.com', fullName: 'Trần Thị Mai', hasPassword: false },
  });
  const store = makeStore();

  await store.dispatch(googleSignIn());

  // the official mock of the Google SDK answers with "mockIdToken"
  expect(post).toHaveBeenCalledWith('/api/auth/google', { idToken: 'mockIdToken' });
  expect(store.getState().auth).toEqual({
    status: 'signedIn',
    user: { id: '7', email: 'mai@gmail.com', fullName: 'Trần Thị Mai', hasPassword: false },
  });
});

test('closing the Google picker is not an error and sends nothing', async () => {
  jest.spyOn(GoogleSignin, 'signIn').mockResolvedValue({ type: 'cancelled', data: null });
  const post = jest.spyOn(apiClient.http, 'post');

  expect(await getGoogleIdToken()).toBeNull();
  const result = await makeStore().dispatch(googleSignIn());

  expect(googleSignIn.rejected.match(result) && result.payload).toBeFalsy();
  expect(post).not.toHaveBeenCalled();
});

test('a refusal from the server is shown, and the Google account is forgotten for the next try', async () => {
  const err = Object.assign(new Error('401'), {
    isAxiosError: true,
    response: { status: 401, data: { code: 'INVALID_GOOGLE_TOKEN', detail: 'Không xác thực được tài khoản Google' } },
  });
  jest.spyOn(apiClient.http, 'post').mockRejectedValue(err);
  const signOut = jest.spyOn(GoogleSignin, 'signOut');

  const result = await makeStore().dispatch(googleSignIn());

  expect(googleSignIn.rejected.match(result) && result.payload?.code).toBe('INVALID_GOOGLE_TOKEN');
  expect(signOut).toHaveBeenCalled();
});
