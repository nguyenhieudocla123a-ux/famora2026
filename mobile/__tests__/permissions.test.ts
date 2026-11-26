import { can } from '../src/features/family/permissions';

describe('UI permission matrix (mirrors docs section 7)', () => {
  test('nobody can remove the OWNER', () => {
    expect(can.removeMember('OWNER', 'OWNER')).toBe(false);
    expect(can.removeMember('ADMIN', 'OWNER')).toBe(false);
  });

  test('ADMIN can remove MEMBER only; OWNER can remove ADMIN', () => {
    expect(can.removeMember('ADMIN', 'MEMBER')).toBe(true);
    expect(can.removeMember('ADMIN', 'ADMIN')).toBe(false);
    expect(can.removeMember('OWNER', 'ADMIN')).toBe(true);
    expect(can.removeMember('MEMBER', 'MEMBER')).toBe(false);
  });

  test('only OWNER changes roles or disbands; OWNER cannot just leave', () => {
    expect(can.changeRoles('ADMIN')).toBe(false);
    expect(can.disband('ADMIN')).toBe(false);
    expect(can.disband('OWNER')).toBe(true);
    expect(can.leave('OWNER')).toBe(false);
    expect(can.leave('MEMBER')).toBe(true);
  });
});
