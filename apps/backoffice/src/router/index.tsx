import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Layout from '../components/layout/Layout';
import PrivateRoute from '../components/auth/PrivateRoute';
import DashboardPage from '../pages/DashboardPage';
import HuntsPage from '../pages/HuntsPage';
import HuntCreatePage from '../pages/HuntCreatePage';
import HuntEditPage from '../pages/HuntEditPage';
import StepsPage from '../pages/StepsPage';
import StatsPage from '../pages/StatsPage';
import SettingsPage from '../pages/SettingsPage';

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
          { path: 'hunts', element: <HuntsPage /> },
          { path: 'hunts/new', element: <HuntCreatePage /> },
          { path: 'hunts/:id/edit', element: <HuntEditPage /> },
          { path: 'hunts/:id/steps', element: <StepsPage /> },
          { path: 'stats', element: <StatsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
