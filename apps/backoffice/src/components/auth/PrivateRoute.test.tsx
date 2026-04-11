import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '@lootopia/shared';

const Protected = () => <div>Page protégée</div>;
const Login = () => <div>Page login</div>;

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Protected />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('redirige vers /login si non authentifié', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByText('Page login')).toBeInTheDocument();
  });

  it('affiche la page protégée si authentifié', () => {
    useAuthStore.setState({
      token: 'tok123',
      user: { id: 'u1', email: 'p@test.com', role: Role.PARTNER },
    });
    renderWithRouter('/dashboard');
    expect(screen.getByText('Page protégée')).toBeInTheDocument();
  });
});
