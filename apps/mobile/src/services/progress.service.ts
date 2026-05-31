import { api } from './api';
import type { ProgressMap } from '@lootopia/shared';

export const progressService = {
  getHuntProgress: (huntId: string): Promise<ProgressMap> =>
    api.get<ProgressMap>(`/hunts/${huntId}/progress`).then((r) => r.data),
};
