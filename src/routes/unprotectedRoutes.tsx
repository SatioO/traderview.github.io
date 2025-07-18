import type { RouteConfig } from '../types/routes';
import BrokerCallback from '../components/auth/BrokerCallback';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';

// These routes do NOT require authentication
export const unprotectedRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: <LoginPage />,
    protected: false,
    title: 'Login',
    description: 'User login page',
  },
  {
    path: '/signup',
    element: <SignupPage />,
    protected: false,
    title: 'Sign Up',
    description: 'User registration page',
  },
  {
    path: '/auth/:brokerName/callback',
    element: <BrokerCallback />,
    protected: false,
    title: 'Authentication Callback',
    description: 'Handles broker authentication callback',
  },
  // Future unprotected routes can be added here:
  // {
  //   path: '/about',
  //   element: <About />,
  //   protected: false,
  //   title: 'About',
  //   description: 'About TradeView platform',
  // },
  // {
  //   path: '/terms',
  //   element: <Terms />,
  //   protected: false,
  //   title: 'Terms of Service',
  //   description: 'Terms and conditions',
  // },
  // {
  //   path: '/privacy',
  //   element: <Privacy />,
  //   protected: false,
  //   title: 'Privacy Policy',
  //   description: 'Privacy policy and data handling',
  // },
  // {
  //   path: '/help',
  //   element: <Help />,
  //   protected: false,
  //   title: 'Help',
  //   description: 'Help and documentation',
  // },
];