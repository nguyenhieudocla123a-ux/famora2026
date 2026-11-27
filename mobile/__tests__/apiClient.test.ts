import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createApiClient } from '../src/shared/api/client';
import { tokenStore } from '../src/shared/api/tokenStore';
import { toApiError } from '../src/shared/api/apiError';

/** A fake server: answers by URL, records every call. */
function fakeServer(handle: (c: InternalAxiosRequestConfig) => { status: number; data?: unknown }) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async config => {
    calls.push(config);
    const { status, data } = handle(config);
    const response = { status, data, headers: {}, config, statusText: String(status) } as AxiosResponse;
    if (status >= 400) {
      const err = Object.assign(new Error('HTTP ' + status), { isAxiosError: true, response, config });
      throw err;
    }
    return response;
  };
  return { adapter, calls };
}

const pair = (n: number) => ({
  accessToken: 'access-' + n,
  tokenType: 'Bearer',
  expiresAt: '',
  refreshToken: 'refresh-' + n,
  refreshExpiresAt: '',
});

beforeEach(async () => {
  await tokenStore.clear();
});

test('adds the access token to every request', async () => {
  tokenStore.setAccess('access-1');
  const server = fakeServer(() => ({ status: 200, data: {} }));
  const { http } = createApiClient({ baseURL: 'http://x', adapter: server.adapter });
  await http.get('/api/users/me');
  expect(server.calls[0].headers.Authorization).toBe('Bearer access-1');
});

test('three requests failing with 401 at once trigger ONE refresh, then all retry with the new token', async () => {
  tokenStore.setAccess('expired');
  await tokenStore.setRefresh('refresh-1');
  const server = fakeServer(c => {
    if (c.url === '/api/auth/refresh') {
      return { status: 200, data: pair(2) };
    }
    return c.headers.Authorization === 'Bearer access-2' ? { status: 200, data: { ok: c.url } } : { status: 401 };
  });
  const { http } = createApiClient({ baseURL: 'http://x', adapter: server.adapter });

  const results = await Promise.all([http.get('/a'), http.get('/b'), http.get('/c')]);

  expect(results.map(r => r.data.ok)).toEqual(['/a', '/b', '/c']);
  expect(server.calls.filter(c => c.url === '/api/auth/refresh')).toHaveLength(1);
  expect(tokenStore.getAccess()).toBe('access-2');
  expect(await tokenStore.getRefresh()).toBe('refresh-2');
});

test('when the refresh is refused, tokens are cleared and the app is told the session expired', async () => {
  tokenStore.setAccess('expired');
  await tokenStore.setRefresh('revoked');
  const server = fakeServer(c =>
    c.url === '/api/auth/refresh' ? { status: 401, data: { code: 'REFRESH_TOKEN_REUSED' } } : { status: 401 },
  );
  const client = createApiClient({ baseURL: 'http://x', adapter: server.adapter });
  const expired = jest.fn();
  client.onSessionExpired(expired);

  await expect(client.http.get('/api/families')).rejects.toBeTruthy();
  expect(expired).toHaveBeenCalledTimes(1);
  expect(tokenStore.getAccess()).toBeNull();
  expect(await tokenStore.getRefresh()).toBeNull();
});

test('a wrong password on login does not try to refresh', async () => {
  const server = fakeServer(() => ({ status: 401, data: { code: 'INVALID_CREDENTIALS', detail: 'Email hoặc mật khẩu không đúng' } }));
  const { http } = createApiClient({ baseURL: 'http://x', adapter: server.adapter });
  const err = await http.post('/api/auth/login', {}).catch(e => toApiError(e));
  expect(err).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' });
  expect(server.calls).toHaveLength(1);
});

test('server validation errors become per-field messages; no response becomes a network error', () => {
  const validation = toApiError({
    isAxiosError: true,
    response: { status: 400, data: { code: 'VALIDATION_ERROR', detail: 'Dữ liệu không hợp lệ', errors: [{ field: 'email', message: 'Email chưa đúng định dạng' }] } },
  });
  expect(validation.fieldErrors).toEqual({ email: 'Email chưa đúng định dạng' });
  expect(toApiError({ isAxiosError: true, code: 'ERR_NETWORK' })).toMatchObject({ status: 0, code: 'NETWORK' });
});
