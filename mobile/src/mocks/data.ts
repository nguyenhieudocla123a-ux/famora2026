/**
 * PHASE 2 MOCK - the last sample data left: notifications, replaced by the real API in Phase 7d.
 */
import { AppNotification } from '../shared/types/domain';

export const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'Còn 3 ngày đến giỗ bà nội', body: 'Chủ nhật 29/11 (21/10 âm) tại nhà thờ họ, Nam Định.', createdAt: '2026-11-26T08:00:00+07:00', read: false, eventId: 'e4', eventDate: '2026-11-29' },
  { id: 'n2', title: 'Ngày mai: họp mặt cuối năm', body: 'Thứ bảy 28/11 lúc 18:00 ở nhà bác Cả.', createdAt: '2026-11-27T08:00:00+07:00', read: false, eventId: 'e3', eventDate: '2026-11-28' },
  { id: 'n3', title: 'Chị Mai đã tạo sự kiện mới', body: 'Sinh nhật mẹ, thứ năm 03/12.', createdAt: '2026-11-24T20:15:00+07:00', read: true, eventId: 'e5', eventDate: '2026-12-03' },
  { id: 'n4', title: 'Bác Cả đã tham gia gia đình', body: 'Gia đình họ Nguyễn có 8 thành viên.', createdAt: '2026-11-20T09:40:00+07:00', read: true },
];
