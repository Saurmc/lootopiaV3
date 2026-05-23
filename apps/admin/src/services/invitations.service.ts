import { api } from './api';

export interface Invitation {
  id: string;
  email: string;
  partner_name: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface CreateInvitationPayload {
  email: string;
  partnerName?: string;
}

export interface CreateInvitationResponse {
  id: string;
  email: string;
  expiresAt: string;
}

export function invitationStatus(inv: Invitation): 'pending' | 'used' | 'expired' {
  if (inv.used_at) return 'used';
  if (new Date(inv.expires_at) < new Date()) return 'expired';
  return 'pending';
}

export const invitationsService = {
  list: async (): Promise<Invitation[]> => {
    const { data } = await api.get<Invitation[]>('/admin/invitations');
    return data;
  },

  create: async (payload: CreateInvitationPayload): Promise<CreateInvitationResponse> => {
    const { data } = await api.post<CreateInvitationResponse>('/admin/invitations', payload);
    return data;
  },
};
