import { toNotification } from '../src/features/notification/api/notificationApi';
import { secondsLeft } from '../src/shared/api/client';

test('a reminder about an event can open that event on its day', () => {
  const n = toNotification({
    id: 5,
    familyId: 1,
    type: 'REMINDER',
    title: 'Giỗ bà nội',
    body: 'Ngày mai: Chủ nhật 29/11/2026 (21/10 âm)',
    refType: 'EVENT',
    refId: 9,
    refDate: '2026-11-29',
    read: false,
    createdAt: '2026-11-28T01:00:00Z',
  });
  expect(n).toMatchObject({ id: '5', familyId: '1', eventId: '9', eventDate: '2026-11-29', read: false });
});

test('a notification without an event, or without its day, opens nothing', () => {
  const base = { id: 1, type: 'TEST', title: 't', body: 'b', read: true, createdAt: '2026-11-28T01:00:00Z' };
  expect(toNotification({ ...base, familyId: null }).eventId).toBeUndefined();
  expect(toNotification({ ...base, refType: 'EVENT', refId: 3, refDate: null }).eventDate).toBeUndefined();
});

test('secondsLeft reads the exp claim of a JWT', () => {
  // header {"alg":"HS256"}, payload {"sub":"2","exp":1000900}, base64url without padding
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiZXhwIjoxMDAwOTAwfQ.sig';
  expect(secondsLeft(token, 1_000_000_000)).toBe(900);
  expect(secondsLeft('not-a-jwt')).toBe(0);
});
