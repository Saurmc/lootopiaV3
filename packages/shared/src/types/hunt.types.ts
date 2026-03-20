export type HuntStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: number;
  points: number;
  isActive: boolean;
  status: HuntStatus;
}
