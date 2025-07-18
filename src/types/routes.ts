import React from 'react';

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  index?: boolean;
  protected?: boolean;
  title?: string;
  description?: string;
  children?: RouteConfig[];
}

export interface RouteDefinition {
  path: string;
  component: React.ComponentType;
  protected?: boolean;
  title?: string;
  description?: string;
}

export type RouteKey = 
  | 'HOME'
  | 'TRADING_CALCULATOR'
  | 'BROKER_CALLBACK'
  | 'LOGIN'
  | 'PORTFOLIO'
  | 'MARKET_ANALYSIS'
  | 'SETTINGS'
  | 'PROFILE';

export interface RouteConfiguration {
  protected: RouteConfig[];
  unprotected: RouteConfig[];
}