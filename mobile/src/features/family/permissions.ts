import { FamilyRole } from '../../shared/types/domain';

/**
 * UI-side mirror of the permission matrix in docs/phase-1-architecture.md (section 7).
 * It only decides which buttons to show. The backend checks every request again;
 * hiding a button is never the security boundary.
 */
export const can = {
  editFamily: (r: FamilyRole) => r === 'OWNER' || r === 'ADMIN',
  invite: (r: FamilyRole) => r === 'OWNER' || r === 'ADMIN',
  changeRoles: (r: FamilyRole) => r === 'OWNER',
  removeMember: (actor: FamilyRole, target: FamilyRole) =>
    target !== 'OWNER' && (actor === 'OWNER' || (actor === 'ADMIN' && target === 'MEMBER')),
  managePersons: (r: FamilyRole) => r === 'OWNER' || r === 'ADMIN',
  disband: (r: FamilyRole) => r === 'OWNER',
  leave: (r: FamilyRole) => r !== 'OWNER',
};
