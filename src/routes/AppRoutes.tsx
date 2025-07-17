import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { routeConfig, ROUTES } from './index';

const AppRoutes: React.FC = () => {
  const routes = useRoutes([
    ...routeConfig,
    // Fallback route - redirect any unknown path to home
    {
      path: '*',
      element: <Navigate to={ROUTES.HOME} replace />,
    },
  ]);

  return routes;
};

export default AppRoutes;