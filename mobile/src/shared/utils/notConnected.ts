import { Alert } from 'react-native';

/**
 * Phase 2 is UI only. Write actions (create, update, delete) validate their form, then say
 * plainly that nothing was saved yet, instead of pretending to succeed. Removed in Phase 7.
 */
export function notConnected(action: string) {
  Alert.alert(
    'Chưa kết nối máy chủ',
    `${action}: dữ liệu đã hợp lệ nhưng chưa được lưu. Chức năng này sẽ hoạt động khi ứng dụng kết nối backend.`,
  );
}
