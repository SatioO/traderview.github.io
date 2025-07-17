import type { RouteObject } from 'react-router-dom';
import TradingCalculator from '../containers/TradingCalculator';

// Route configuration - easy to extend for future routes
// eslint-disable-next-line react-refresh/only-export-components
export const routeConfig: RouteObject[] = [
  {
    path: '/',
    element: <TradingCalculator />,
    index: true,
  },
  {
    path: '/trading-calculator',
    element: <TradingCalculator />,
  },
  // Future routes can be added here:
  // {
  //   path: '/portfolio',
  //   element: <Portfolio />,
  // },
  // {
  //   path: '/market-analysis',
  //   element: <MarketAnalysis />,
  // },
  // {
  //   path: '/settings',
  //   element: <Settings />,
  // },
  // {
  //   path: '/profile',
  //   element: <Profile />,
  // },
];

// Route paths constants for easy reference
export const ROUTES = {
  HOME: '/',
  TRADING_CALCULATOR: '/trading-calculator',
  // Future route constants:
  // PORTFOLIO: '/portfolio',
  // MARKET_ANALYSIS: '/market-analysis',
  // SETTINGS: '/settings',
  // PROFILE: '/profile',
} as const;

export type RouteKey = keyof typeof ROUTES;
