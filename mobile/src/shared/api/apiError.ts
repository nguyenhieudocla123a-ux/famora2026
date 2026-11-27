import { AxiosError, isAxiosError } from 'axios';

/** One error shape for the whole app, read from the backend's ProblemDetail. */
export interface ApiError {
  /** HTTP status; 0 when the server could not be reached. */
  status: number;
  /** The backend's business code, e.g. INVALID_CREDENTIALS, or NETWORK / TIMEOUT / UNKNOWN. */
  code: string;
  /** A message ready to show (Vietnamese). */
  message: string;
  /** Per-field validation messages, keyed by field name. */
  fieldErrors: Record<string, string>;
}

interface ProblemBody {
  code?: string;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export function toApiError(e: unknown): ApiError {
  if (isAxiosError(e)) {
    return fromAxios(e);
  }
  return { status: 0, code: 'UNKNOWN', message: 'Có lỗi xảy ra, vui lòng thử lại', fieldErrors: {} };
}

function fromAxios(e: AxiosError<ProblemBody>): ApiError {
  if (!e.response) {
    const timeout = e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT';
    return {
      status: 0,
      code: timeout ? 'TIMEOUT' : 'NETWORK',
      message: timeout
        ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại'
        : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại',
      fieldErrors: {},
    };
  }
  const body = e.response.data ?? {};
  const fieldErrors: Record<string, string> = {};
  for (const f of body.errors ?? []) {
    fieldErrors[f.field] ??= f.message;
  }
  return {
    status: e.response.status,
    code: body.code ?? 'HTTP_' + e.response.status,
    message: body.detail ?? 'Có lỗi xảy ra, vui lòng thử lại',
    fieldErrors,
  };
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'status' in e && 'fieldErrors' in e;
}
