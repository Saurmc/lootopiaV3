import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { Role } from '@lootopia/shared';

const mockUser = { id: 'u1', email: 'partner@test.com', role: Role.PARTNER };

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('démarre sans token ni user', () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('setAuth stocke le token et le user', () => {
    useAuthStore.getState().setAuth('tok123', mockUser);
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('tok123');
    expect(user).toEqual(mockUser);
  });

  it('clearAuth efface le token et le user', () => {
    useAuthStore.getState().setAuth('tok123', mockUser);
    useAuthStore.getState().clearAuth();
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });
});
