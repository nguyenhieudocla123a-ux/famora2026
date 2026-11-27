import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import { ApiError, toApiError } from './apiError';

interface Args {
  url: string;
  method?: AxiosRequestConfig['method'];
  body?: unknown;
  params?: AxiosRequestConfig['params'];
}

/** RTK Query calls go through the same Axios client, so they get the token and the refresh for free. */
const axiosBaseQuery: BaseQueryFn<Args | string, unknown, ApiError> = async arg => {
  const { url, method = 'GET', body, params } = typeof arg === 'string' ? { url: arg } : arg;
  try {
    const res = await apiClient.http.request({ url, method, data: body, params });
    return { data: res.data };
  } catch (e) {
    return { error: toApiError(e) };
  }
};

/**
 * One API slice; features add their endpoints with injectEndpoints. Tags let a change (create, edit, delete)
 * refresh exactly the lists that show it.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Me', 'Families', 'Family', 'Members', 'Invitations', 'Persons', 'Events', 'Reminders', 'Notifications'],
  endpoints: () => ({}),
});
