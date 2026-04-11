import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockLogin = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    logout: vi.fn(),
    token: null,
    user: null,
    isAuthenticated: false,
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les champs email et mot de passe', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('affiche une erreur si le formulaire est soumis vide', async () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si le mot de passe est trop court', async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'partner@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/8 caractères minimum/i)).toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur serveur en cas d'échec de connexion", async () => {
    mockLogin.mockRejectedValueOnce(new Error('401'));

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'partner@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'wrongpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
    });
  });
});
