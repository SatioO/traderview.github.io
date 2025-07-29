import type { RouteConfig } from '../types/routes';
import TradingCalculator from '../containers/TradingCalculator';
import { Navigate } from 'react-router-dom';

// These routes require authentication
export const protectedRoutes: RouteConfig[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    index: true,
    protected: true,
    title: 'Home Redirect',
    description: 'Redirects to dashboard',
  },
  {
    path: '/dashboard',
    element: <TradingCalculator />,
    protected: true,
    title: 'Trading Calculator',
    description: 'Main trading calculator interface',
  },
  // Future protected routes can be added here:
  // {
  //   path: '/portfolio',
  //   element: <Portfolio />,
  //   protected: true,
  //   title: 'Portfolio',
  //   description: 'View and manage your portfolio',
  // },
  // {
  //   path: '/market-analysis',
  //   element: <MarketAnalysis />,
  //   protected: true,
  //   title: 'Market Analysis',
  //   description: 'Advanced market analysis tools',
  // },
  // {
  //   path: '/settings',
  //   element: <Settings />,
  //   protected: true,
  //   title: 'Settings',
  //   description: 'Application settings and preferences',
  // },
  // {
  //   path: '/profile',
  //   element: <Profile />,
  //   protected: true,
  //   title: 'Profile',
  //   description: 'User profile and account settings',
  // },
];
