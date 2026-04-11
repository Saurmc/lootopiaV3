import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role } from '@lootopia/shared';

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from './api';
import { authService } from './auth.service';

const makeToken = (payload: object) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne un token et un user décodé', async () => {
    const token = makeToken({ sub: 'u1', role: Role.PARTNER, iat: 0, exp: 9999999999 });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access_token: token } });

    const result = await authService.login({ email: 'partner@test.com', password: 'secret123' });

    expect(result.token).toBe(token);
    expect(result.user.id).toBe('u1');
    expect(result.user.role).toBe(Role.PARTNER);
    expect(result.user.email).toBe('partner@test.com');
  });

  it('propage les erreurs réseau', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'));
    await expect(
      authService.login({ email: 'x@x.com', password: 'password1' }),
    ).rejects.toThrow('Network Error');
  });
});
