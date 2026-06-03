import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Layout from '../components/layout/Layout';
import DashboardPage from '../pages/DashboardPage';
import InvitationsPage from '../pages/InvitationsPage';
import UsersPage from '../pages/UsersPage';
import HuntsPage from '../pages/HuntsPage';
import BadgesPage from '../pages/BadgesPage';
import PartnersPage from '../pages/PartnersPage';
import { useAuthStore } from '../store/auth.store';

function PrivateRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'invitations', element: <InvitationsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'hunts', element: <HuntsPage /> },
          { path: 'badges', element: <BadgesPage /> },
          { path: 'partners', element: <PartnersPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
