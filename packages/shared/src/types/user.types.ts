export enum Role {
  PLAYER = 'PLAYER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string | null;
  role: Role;
  pseudo: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  consent_gps: boolean;
  createdAt: string;
  updatedAt: string;
}
