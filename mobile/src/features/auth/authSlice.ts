import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient, TokenPair } from '../../shared/api/client';
import { tokenStore } from '../../shared/api/tokenStore';
import { ApiError, toApiError } from '../../shared/api/apiError';
import { baseApi } from '../../shared/api/baseApi';
import type { UserProfile } from '../../shared/types/domain';

/**
 * The session: booting (reading the stored refresh token), signed out, or signed in with a user.
 * Tokens never enter Redux: the access token lives in memory, the refresh token in the secure store.
 */
export interface AuthState {
  status: 'booting' | 'signedOut' | 'signedIn';
  user: UserProfile | null;
}

const initialState: AuthState = { status: 'booting', user: null };

interface UserDto {
  id: number;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

const toUser = (u: UserDto): UserProfile => ({
  id: String(u.id),
  email: u.email,
  fullName: u.fullName,
  dateOfBirth: u.dateOfBirth,
  avatarUrl: u.avatarUrl,
});

async function fetchMe(): Promise<UserProfile> {
  const res = await apiClient.http.get<UserDto>('/api/users/me');
  return toUser(res.data);
}

/** App start: a stored refresh token signs the user in without asking for the password again. */
export const bootstrap = createAsyncThunk<UserProfile | null>('auth/bootstrap', async () => {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) {
    return null;
  }
  try {
    const res = await apiClient.http.post<TokenPair>('/api/auth/refresh', { refreshToken });
    await apiClient.saveTokens(res.data);
    return await fetchMe();
  } catch (e) {
    // Forget the token only when the server refused it. Offline or server down: keep it, so the next start
    // (with a connection) signs the user straight back in instead of asking for the password again.
    if (toApiError(e).status !== 0) {
      await tokenStore.clear();
    }
    return null;
  }
});

export const login = createAsyncThunk<UserProfile, { email: string; password: string }, { rejectValue: ApiError }>(
  'auth/login',
  async (body, { rejectWithValue }) => {
    try {
      const res = await apiClient.http.post<TokenPair>('/api/auth/login', body);
      await apiClient.saveTokens(res.data);
      return await fetchMe();
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

export const register = createAsyncThunk<
  UserProfile,
  { fullName: string; email: string; password: string },
  { rejectValue: ApiError }
>('auth/register', async (body, { rejectWithValue }) => {
  try {
    await apiClient.http.post('/api/auth/register', body);
    const res = await apiClient.http.post<TokenPair>('/api/auth/login', { email: body.email, password: body.password });
    await apiClient.saveTokens(res.data);
    return await fetchMe();
  } catch (e) {
    return rejectWithValue(toApiError(e));
  }
});

/** Revokes this device's refresh token on the server (best effort), then forgets everything locally. */
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  const refreshToken = await tokenStore.getRefresh();
  if (refreshToken) {
    try {
      await apiClient.http.post('/api/auth/logout', { refreshToken });
    } catch {
      // offline or already expired: signing out locally is what matters
    }
  }
  await tokenStore.clear();
  dispatch(baseApi.util.resetApiState());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** The refresh token was refused (expired, revoked, reused): back to the sign-in screen. */
    sessionExpired: () => ({ status: 'signedOut' as const, user: null }),
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrap.fulfilled, (_, { payload }) =>
        payload ? { status: 'signedIn' as const, user: payload } : { status: 'signedOut' as const, user: null },
      )
      .addCase(bootstrap.rejected, () => ({ status: 'signedOut' as const, user: null }))
      .addCase(login.fulfilled, (_, { payload }) => ({ status: 'signedIn' as const, user: payload }))
      .addCase(register.fulfilled, (_, { payload }) => ({ status: 'signedIn' as const, user: payload }))
      .addCase(logout.fulfilled, () => ({ status: 'signedOut' as const, user: null }));
  },
});

export const { sessionExpired } = authSlice.actions;
export const authReducer = authSlice.reducer;
