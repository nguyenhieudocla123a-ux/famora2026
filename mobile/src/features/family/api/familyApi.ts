import { baseApi } from '../../../shared/api/baseApi';
import type { FamilyMember, FamilyPerson, FamilyRole, FamilySummary, Invitation } from '../../../shared/types/domain';
import { instantToVnDate } from '../../../shared/utils/date';

/* Server shapes: ids are numbers there, strings in the app (navigation params, React keys). */

interface FamilyDto {
  id: number;
  name: string;
  description?: string;
  myRole: FamilyRole;
  memberCount: number;
  memberCanCreateEvents: boolean;
}

interface MemberDto {
  id: number;
  userId: number;
  fullName: string;
  nickname?: string;
  role: FamilyRole;
  joinedAt: string;
}

interface InvitationDto {
  id: number;
  code: string;
  role: Exclude<FamilyRole, 'OWNER'>;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
}

interface PersonDto {
  id: number;
  memberId?: number;
  fullName: string;
  nickname?: string;
  deceased: boolean;
  deathLunarDay?: number;
  deathLunarMonth?: number;
  nextAnniversary?: string;
}

export const toFamily = (f: FamilyDto): FamilySummary => ({ ...f, id: String(f.id) });

const toMember = (m: MemberDto): FamilyMember => ({
  id: String(m.id),
  userId: String(m.userId),
  fullName: m.fullName,
  nickname: m.nickname,
  role: m.role,
  joinedAt: instantToVnDate(m.joinedAt),
});

const toInvitation = (i: InvitationDto): Invitation => ({
  id: String(i.id),
  code: i.code,
  role: i.role,
  maxUses: i.maxUses,
  usedCount: i.usedCount,
  expiresAt: instantToVnDate(i.expiresAt),
});

const toPerson = (p: PersonDto): FamilyPerson => ({
  id: String(p.id),
  memberId: p.memberId == null ? undefined : String(p.memberId),
  fullName: p.fullName,
  nickname: p.nickname,
  isDeceased: p.deceased,
  deathLunar:
    p.deathLunarDay != null && p.deathLunarMonth != null ? { day: p.deathLunarDay, month: p.deathLunarMonth } : undefined,
  nextAnniversary: p.nextAnniversary,
});

export interface FamilyInput {
  name: string;
  description?: string;
  memberCanCreateEvents: boolean;
}

export interface PersonInput {
  fullName: string;
  nickname?: string;
  deceased: boolean;
  deathLunarDay?: number;
  deathLunarMonth?: number;
  createAnniversary?: boolean;
}

/**
 * Families, members, invitation codes and relatives. Each write invalidates exactly the lists it changes,
 * so the screens showing them reload by themselves.
 */
export const familyApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getFamilies: build.query<FamilySummary[], void>({
      query: () => '/api/families',
      transformResponse: (list: FamilyDto[]) => list.map(toFamily),
      providesTags: ['Families'],
    }),
    createFamily: build.mutation<FamilySummary, FamilyInput>({
      query: body => ({ url: '/api/families', method: 'POST', body }),
      transformResponse: toFamily,
      invalidatesTags: ['Families'],
    }),
    updateFamily: build.mutation<FamilySummary, FamilyInput & { familyId: string }>({
      query: ({ familyId, ...body }) => ({ url: `/api/families/${familyId}`, method: 'PUT', body }),
      transformResponse: toFamily,
      invalidatesTags: ['Families'],
    }),
    dissolveFamily: build.mutation<void, string>({
      query: familyId => ({ url: `/api/families/${familyId}`, method: 'DELETE' }),
      invalidatesTags: ['Families'],
    }),
    leaveFamily: build.mutation<void, string>({
      query: familyId => ({ url: `/api/families/${familyId}/leave`, method: 'POST' }),
      invalidatesTags: ['Families'],
    }),
    joinFamily: build.mutation<FamilySummary, { code: string; nickname?: string }>({
      query: body => ({ url: '/api/families/join', method: 'POST', body }),
      transformResponse: toFamily,
      invalidatesTags: ['Families'],
    }),

    getMembers: build.query<FamilyMember[], string>({
      query: familyId => `/api/families/${familyId}/members`,
      transformResponse: (list: MemberDto[]) => list.map(toMember),
      providesTags: (_r, _e, familyId) => [{ type: 'Members', id: familyId }],
    }),
    changeRole: build.mutation<void, { familyId: string; memberId: string; role: 'ADMIN' | 'MEMBER' }>({
      query: ({ familyId, memberId, role }) => ({
        url: `/api/families/${familyId}/members/${memberId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Members', id: a.familyId }],
    }),
    removeMember: build.mutation<void, { familyId: string; memberId: string }>({
      query: ({ familyId, memberId }) => ({ url: `/api/families/${familyId}/members/${memberId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Members', id: a.familyId }, 'Families'],
    }),
    transferOwnership: build.mutation<void, { familyId: string; memberId: string }>({
      query: ({ familyId, memberId }) => ({
        url: `/api/families/${familyId}/transfer-ownership`,
        method: 'POST',
        body: { memberId: Number(memberId) },
      }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Members', id: a.familyId }, 'Families'],
    }),

    getInvitations: build.query<Invitation[], string>({
      query: familyId => `/api/families/${familyId}/invitations`,
      transformResponse: (list: InvitationDto[]) => list.map(toInvitation),
      providesTags: (_r, _e, familyId) => [{ type: 'Invitations', id: familyId }],
    }),
    createInvitation: build.mutation<
      Invitation,
      { familyId: string; role: 'ADMIN' | 'MEMBER'; maxUses: number; validDays: number }
    >({
      query: ({ familyId, ...body }) => ({ url: `/api/families/${familyId}/invitations`, method: 'POST', body }),
      transformResponse: toInvitation,
      invalidatesTags: (_r, _e, a) => [{ type: 'Invitations', id: a.familyId }],
    }),
    revokeInvitation: build.mutation<void, { familyId: string; invitationId: string }>({
      query: ({ familyId, invitationId }) => ({
        url: `/api/families/${familyId}/invitations/${invitationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, a) => [{ type: 'Invitations', id: a.familyId }],
    }),

    getPersons: build.query<FamilyPerson[], string>({
      query: familyId => `/api/families/${familyId}/persons`,
      transformResponse: (list: PersonDto[]) => list.map(toPerson),
      providesTags: (_r, _e, familyId) => [{ type: 'Persons', id: familyId }],
    }),
    createPerson: build.mutation<FamilyPerson, PersonInput & { familyId: string }>({
      query: ({ familyId, ...body }) => ({ url: `/api/families/${familyId}/persons`, method: 'POST', body }),
      transformResponse: toPerson,
      // a person created with createAnniversary also adds an event
      invalidatesTags: (_r, _e, a) => [{ type: 'Persons', id: a.familyId }, 'Events'],
    }),
  }),
});

export const {
  useGetFamiliesQuery,
  useCreateFamilyMutation,
  useUpdateFamilyMutation,
  useDissolveFamilyMutation,
  useLeaveFamilyMutation,
  useJoinFamilyMutation,
  useGetMembersQuery,
  useChangeRoleMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useRevokeInvitationMutation,
  useGetPersonsQuery,
  useCreatePersonMutation,
} = familyApi;
