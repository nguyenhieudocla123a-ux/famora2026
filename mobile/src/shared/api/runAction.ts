import { Alert } from 'react-native';
import { ApiError, isApiError } from './apiError';

/**
 * Runs a write (an RTK Query mutation's unwrap()) and shows the server's message if it fails.
 * Returns the result, or null when it failed, so screens can write: `const fam = await runAction(...)`.
 * Pass {@code onError} to handle some codes in place (e.g. put the message under a field) and return
 * true when handled.
 */
export async function runAction<T>(
  action: () => Promise<T>,
  onError?: (e: ApiError) => boolean,
): Promise<T | null> {
  try {
    return await action();
  } catch (e) {
    const err: ApiError = isApiError(e)
      ? e
      : { status: 0, code: 'UNKNOWN', message: 'Có lỗi xảy ra, vui lòng thử lại', fieldErrors: {} };
    if (!onError?.(err)) {
      Alert.alert('Chưa thực hiện được', err.message);
    }
    return null;
  }
}
