export enum Role {
  PLAYER = 'PLAYER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
