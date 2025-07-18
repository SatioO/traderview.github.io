import type { RouteConfiguration } from '../types/routes';
import { protectedRoutes } from './protectedRoutes';
import { unprotectedRoutes } from './unprotectedRoutes';

// Comprehensive route configuration with protection levels
export const routeConfiguration: RouteConfiguration = {
  protected: protectedRoutes,
  unprotected: unprotectedRoutes,
};

// Get all routes (protected + unprotected)
export const getAllRoutes = () => [
  ...routeConfiguration.protected,
  ...routeConfiguration.unprotected,
];

// Get only protected routes
export const getProtectedRoutes = () => routeConfiguration.protected;

// Get only unprotected routes
export const getUnprotectedRoutes = () => routeConfiguration.unprotected;

// Route paths constants for easy reference
export const ROUTES = {
  // Protected routes
  HOME: '/',
  
  // Unprotected routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  BROKER_CALLBACK: '/auth/:brokerName/callback',
  
  // Future route constants:
  // PORTFOLIO: '/portfolio',
  // MARKET_ANALYSIS: '/market-analysis',
  // SETTINGS: '/settings',
  // PROFILE: '/profile',
  // ABOUT: '/about',
  // TERMS: '/terms',
  // PRIVACY: '/privacy',
  // HELP: '/help',
} as const;

export type RouteKey = keyof typeof ROUTES;

// Utility functions
export const isProtectedRoute = (path: string): boolean => {
  return protectedRoutes.some(route => route.path === path);
};

export const isUnprotectedRoute = (path: string): boolean => {
  return unprotectedRoutes.some(route => route.path === path);
};

export const getRouteByPath = (path: string) => {
  return getAllRoutes().find(route => route.path === path);
};