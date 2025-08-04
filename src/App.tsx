import './App.css';
import {
  HashRouter,
  useRoutes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { TradingProvider } from './contexts/TradingContext';
// import { LiveDataProvider } from './contexts/LiveDataProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getUnprotectedRoutes, getProtectedRoutes, ROUTES } from './routes';
import LoadingScreen from './components/LoadingScreen';
import type { RouteObject } from 'react-router-dom';

function AppRoutes() {
  // Convert route configs to RouteObjects
  const convertRoutes = (routes: any[]) => {
    return routes.map((route) => {
      if (route.index) {
        return {
          index: true,
          element: route.element,
        };
      }

      return {
        path: route.path,
        element: route.element,
      };
    });
  };

  const unprotectedRouteObjects: RouteObject[] = convertRoutes(
    getUnprotectedRoutes()
  );
  const protectedRouteObjects: RouteObject[] = convertRoutes(
    getProtectedRoutes()
  ).map((route) => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>,
  }));

  const routes = useRoutes([
    ...unprotectedRouteObjects,
    ...protectedRouteObjects,
    // Fallback route - redirect any unknown path to home
    {
      path: '*',
      element: <Navigate to={ROUTES.HOME} replace />,
    },
  ]);

  return routes;
}

function AppContent() {
  const { isLoading: isSettingsLoading } = useSettings();
  const location = useLocation();

  // Get unprotected route paths for comparison
  const unprotectedRoutes = getUnprotectedRoutes();
  const unprotectedPaths = unprotectedRoutes
    .map((route) => route.path)
    .filter(Boolean);

  // Check if current path is unprotected
  const isUnprotectedRoute = unprotectedPaths.some((path) => {
    if (path === '*') return false; // Ignore wildcard routes
    // Handle dynamic routes like /auth/:brokerName/callback
    const pathPattern = path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pathPattern}$`);
    return regex.test(location.pathname);
  });

  // For unprotected routes, skip settings loading screen
  const shouldShowLoadingScreen = !isUnprotectedRoute && isSettingsLoading;

  return (
    <>
      <LoadingScreen isLoading={shouldShowLoadingScreen} />
      {!shouldShowLoadingScreen && <AppRoutes />}
    </>
  );
}

function App() {
  const basename =
    import.meta.env.MODE === 'development'
      ? '/'
      : import.meta.env.VITE_BASE_PATH || '/';

  return (
    <HashRouter>
      <AuthProvider>
        <SettingsProvider>
          <TradingProvider>
            {/* <LiveDataProvider> */}
            <AppContent />
            {/* </LiveDataProvider> */}
          </TradingProvider>
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
