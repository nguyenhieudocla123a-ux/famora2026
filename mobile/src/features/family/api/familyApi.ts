import { baseApi } from '../../../shared/api/baseApi';
import type { FamilyRole, FamilySummary } from '../../../shared/types/domain';

interface FamilyDto {
  id: number;
  name: string;
  description?: string;
  myRole: FamilyRole;
  memberCount: number;
  memberCanCreateEvents: boolean;
}

/** Ids are numbers on the server, strings in the app (navigation params, keys). */
export const toFamily = (f: FamilyDto): FamilySummary => ({ ...f, id: String(f.id) });

export const familyApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getFamilies: build.query<FamilySummary[], void>({
      query: () => '/api/families',
      transformResponse: (list: FamilyDto[]) => list.map(toFamily),
      providesTags: ['Families'],
    }),
  }),
});

export const { useGetFamiliesQuery } = familyApi;
