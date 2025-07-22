import { apiClient } from './authService';

// Broker API Types
export interface BrokerInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
}

export interface ActiveBrokerSession {
  broker: string;
  brokerUserId: string;
  brokerUserName: string;
  connectedAt: string;
  lastActiveAt: string;
}

export interface AvailableBrokersResponse {
  brokers: BrokerInfo[];
  activeBroker: ActiveBrokerSession | null;
}

export interface BrokerConnectionResponse {
  message: string;
  loginUrl: string;
  broker: string;
}

export interface BrokerCallbackResponse {
  message: string;
  broker: string;
  user: {
    brokerUserId: string;
    brokerUserName: string;
  };
}

export interface ActiveSessionResponse {
  success: boolean;
  hasActiveSession: boolean;
  activeSession: ActiveBrokerSession | null;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface DisconnectBrokerResponse {
  message: string;
  broker: string;
}

// Broker API Service
class BrokerApiService {
  private baseUrl: string = '/brokers';

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${(apiClient as any).baseURL || 'http://localhost:3000/api'}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(apiClient as any).getStoredAccessToken()}`,
        ...(options?.headers as Record<string, string> || {})
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Get all available brokers with connection status
  async getAvailableBrokers(): Promise<AvailableBrokersResponse> {
    return this.makeRequest<AvailableBrokersResponse>(`${this.baseUrl}/available`);
  }

  // Initiate broker connection - get login URL
  async connectBroker(brokerId: string): Promise<BrokerConnectionResponse> {
    return this.makeRequest<BrokerConnectionResponse>(
      `${this.baseUrl}/connect/${brokerId}`,
      { method: 'POST' }
    );
  }

  // Force connect to broker (disconnects existing sessions)
  async forceConnectBroker(brokerId: string): Promise<BrokerConnectionResponse> {
    return this.makeRequest<BrokerConnectionResponse>(
      `${this.baseUrl}/force-connect/${brokerId}`,
      { method: 'POST' }
    );
  }

  // Complete broker authentication after OAuth callback
  async completeBrokerAuth(brokerId: string, requestToken: string): Promise<BrokerCallbackResponse> {
    return this.makeRequest<BrokerCallbackResponse>(
      `${this.baseUrl}/callback/${brokerId}`,
      {
        method: 'POST',
        body: JSON.stringify({ request_token: requestToken })
      }
    );
  }

  // Get active broker session for dashboard
  async getActiveSession(): Promise<ActiveSessionResponse> {
    return this.makeRequest<ActiveSessionResponse>(`${this.baseUrl}/active-session`);
  }

  // Disconnect specific broker
  async disconnectBroker(brokerId: string): Promise<DisconnectBrokerResponse> {
    return this.makeRequest<DisconnectBrokerResponse>(
      `${this.baseUrl}/disconnect/${brokerId}`,
      { method: 'DELETE' }
    );
  }

  // Get all connected brokers
  async getConnectedBrokers(): Promise<{ connectedBrokers: ActiveBrokerSession[] }> {
    return this.makeRequest<{ connectedBrokers: ActiveBrokerSession[] }>(`${this.baseUrl}/connected`);
  }
}

// Create singleton instance
export const brokerApiService = new BrokerApiService();
export default brokerApiService;