/**
 * PHASE 2 MOCK — removed in Phase 7 when screens read from the real API.
 * Names, dates and families are sample content for designing the screens. Each lunar
 * event's solar date was checked against the lunar month table in ./lunarMonths.
 */
import {
  AppNotification,
  EventOccurrence,
  EventType,
  FamilyMember,
  FamilyPerson,
  FamilySummary,
  IsoDate,
  UserProfile,
} from '../shared/types/domain';
import { lunarOf } from './lunarMonths';

export const mockUser: UserProfile = {
  id: 'u1',
  fullName: 'Nguyễn Văn Hiếu',
  email: 'hieu@familyhub.example',
  dateOfBirth: '1998-05-14',
};

export const mockFamilies: FamilySummary[] = [
  {
    id: 'f1',
    name: 'Gia đình họ Nguyễn',
    description: 'Nhà nội ở Nam Định và các cháu',
    myRole: 'OWNER',
    memberCount: 8,
    memberCanCreateEvents: true,
  },
  {
    id: 'f2',
    name: 'Nhà ngoại Hà Đông',
    description: 'Bên ngoại, họp mặt mỗi dịp Tết',
    myRole: 'MEMBER',
    memberCount: 12,
    memberCanCreateEvents: false,
  },
];

export const mockMembers: Record<string, FamilyMember[]> = {
  f1: [
    { id: 'm1', userId: 'u1', fullName: 'Nguyễn Văn Hiếu', role: 'OWNER', joinedAt: '2026-09-02' },
    { id: 'm2', userId: 'u2', fullName: 'Nguyễn Văn Hùng', nickname: 'Bố', role: 'ADMIN', joinedAt: '2026-09-02' },
    { id: 'm3', userId: 'u3', fullName: 'Trần Thị Lan', nickname: 'Mẹ', role: 'ADMIN', joinedAt: '2026-09-03' },
    { id: 'm4', userId: 'u4', fullName: 'Nguyễn Thị Mai', nickname: 'Chị Mai', role: 'MEMBER', joinedAt: '2026-09-05' },
    { id: 'm5', userId: 'u5', fullName: 'Nguyễn Văn Tuấn', nickname: 'Bác Cả', role: 'MEMBER', joinedAt: '2026-09-10' },
  ],
  f2: [
    { id: 'm6', userId: 'u6', fullName: 'Trần Văn Bình', nickname: 'Ông ngoại', role: 'OWNER', joinedAt: '2026-08-20' },
    { id: 'm7', userId: 'u1', fullName: 'Nguyễn Văn Hiếu', role: 'MEMBER', joinedAt: '2026-09-12' },
  ],
};

export const mockPersons: Record<string, FamilyPerson[]> = {
  f1: [
    { id: 'p1', fullName: 'Nguyễn Văn Phúc', nickname: 'Ông nội', isDeceased: true, deathLunar: { day: 8, month: 12 } },
    { id: 'p2', fullName: 'Phạm Thị Hòa', nickname: 'Bà nội', isDeceased: true, deathLunar: { day: 21, month: 10 } },
    { id: 'p3', fullName: 'Nguyễn Minh An', nickname: 'Bé An', isDeceased: false },
    { id: 'p4', fullName: 'Trần Thị Lan', nickname: 'Mẹ', isDeceased: false, memberId: 'm3' },
  ],
  f2: [],
};

interface EventSeed {
  id: string;
  date: IsoDate;
  title: string;
  type: EventType;
  calendarType?: 'SOLAR' | 'LUNAR';
  recurrence?: 'NONE' | 'YEARLY';
  startTime?: string;
  location?: string;
  description?: string;
  related?: string[];
  createdBy?: string;
  reminders?: number[];
  familyId?: string;
}

const seeds: EventSeed[] = [
  { id: 'e1', date: '2026-11-20', title: 'Ngày Nhà giáo Việt Nam', type: 'HOLIDAY', createdBy: 'Hệ thống', reminders: [] },
  { id: 'e2', date: '2026-11-23', title: 'Rằm tháng Mười, thắp hương gia tiên', type: 'IMPORTANT_DAY', calendarType: 'LUNAR', createdBy: 'Nguyễn Văn Hùng', reminders: [1] },
  {
    id: 'e3', date: '2026-11-28', title: 'Họp mặt cuối năm', type: 'FAMILY_EVENT', recurrence: 'NONE',
    startTime: '18:00', location: 'Nhà bác Cả, Nam Định', description: 'Bàn việc chuẩn bị Tết và giỗ ông nội. Mỗi nhà góp một món.',
    createdBy: 'Nguyễn Văn Hiếu', reminders: [1],
  },
  {
    id: 'e4', date: '2026-11-29', title: 'Giỗ bà nội', type: 'DEATH_ANNIVERSARY', calendarType: 'LUNAR',
    startTime: '10:00', location: 'Nhà thờ họ, Nam Định', description: 'Cúng giỗ lúc 10 giờ, ăn cơm trưa cùng cả nhà.',
    related: ['p2'], createdBy: 'Nguyễn Văn Hùng', reminders: [7, 3, 0],
  },
  { id: 'e5', date: '2026-12-03', title: 'Sinh nhật mẹ', type: 'BIRTHDAY', related: ['p4'], createdBy: 'Nguyễn Thị Mai', reminders: [7, 1] },
  { id: 'e6', date: '2026-12-19', title: 'Sinh nhật bé An', type: 'BIRTHDAY', related: ['p3'], createdBy: 'Nguyễn Văn Hiếu', reminders: [3] },
  { id: 'e7', date: '2027-01-01', title: 'Tết Dương lịch', type: 'HOLIDAY', createdBy: 'Hệ thống', reminders: [] },
  { id: 'e8', date: '2027-01-12', title: 'Kỷ niệm 30 năm ngày cưới của bố mẹ', type: 'WEDDING_ANNIVERSARY', createdBy: 'Nguyễn Thị Mai', reminders: [7] },
  {
    id: 'e9', date: '2027-01-15', title: 'Giỗ ông nội', type: 'DEATH_ANNIVERSARY', calendarType: 'LUNAR',
    startTime: '09:30', location: 'Nhà thờ họ, Nam Định', related: ['p1'], createdBy: 'Nguyễn Văn Hùng', reminders: [7, 3, 0],
  },
  { id: 'e10', date: '2027-01-30', title: 'Ông Công ông Táo', type: 'HOLIDAY', calendarType: 'LUNAR', createdBy: 'Hệ thống', reminders: [1] },
  { id: 'e11', date: '2027-02-06', title: 'Tết Nguyên đán Đinh Mùi', type: 'HOLIDAY', calendarType: 'LUNAR', createdBy: 'Hệ thống', reminders: [7] },
  { id: 'e12', date: '2027-02-04', title: 'Tất niên cả nhà', type: 'FAMILY_EVENT', startTime: '17:30', location: 'Nhà nội', createdBy: 'Nguyễn Văn Hiếu', reminders: [3] },
];

const SYSTEM = 'Hệ thống';

export const mockEvents: EventOccurrence[] = seeds.map(s => ({
  eventId: s.id,
  familyId: s.familyId ?? 'f1',
  title: s.title,
  description: s.description,
  type: s.type,
  calendarType: s.calendarType ?? 'SOLAR',
  recurrence: s.recurrence ?? (s.type === 'FAMILY_EVENT' ? 'NONE' : 'YEARLY'),
  date: s.date,
  lunar: lunarOf(s.date),
  startTime: s.startTime,
  location: s.location,
  relatedPersonIds: s.related ?? [],
  createdByName: s.createdBy ?? SYSTEM,
  canEdit: s.createdBy !== SYSTEM,
  reminderDaysBefore: s.reminders ?? [1],
}));

export const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'Còn 3 ngày đến giỗ bà nội', body: 'Chủ nhật 29/11 (21/10 âm) tại nhà thờ họ, Nam Định.', createdAt: '2026-11-26T08:00:00+07:00', read: false, eventId: 'e4', eventDate: '2026-11-29' },
  { id: 'n2', title: 'Ngày mai: họp mặt cuối năm', body: 'Thứ bảy 28/11 lúc 18:00 ở nhà bác Cả.', createdAt: '2026-11-27T08:00:00+07:00', read: false, eventId: 'e3', eventDate: '2026-11-28' },
  { id: 'n3', title: 'Chị Mai đã tạo sự kiện mới', body: 'Sinh nhật mẹ, thứ năm 03/12.', createdAt: '2026-11-24T20:15:00+07:00', read: true, eventId: 'e5', eventDate: '2026-12-03' },
  { id: 'n4', title: 'Bác Cả đã tham gia gia đình', body: 'Gia đình họ Nguyễn có 8 thành viên.', createdAt: '2026-11-20T09:40:00+07:00', read: true },
];
