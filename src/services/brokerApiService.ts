import httpClient from './httpClient';

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

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<T> {
    switch (method) {
      case 'GET':
        const getResponse = await httpClient.get<T>(endpoint);
        return getResponse.data;
      case 'POST':
        const postResponse = await httpClient.post<T>(endpoint, data);
        return postResponse.data;
      case 'PUT':
        const putResponse = await httpClient.put<T>(endpoint, data);
        return putResponse.data;
      case 'PATCH':
        const patchResponse = await httpClient.patch<T>(endpoint, data);
        return patchResponse.data;
      case 'DELETE':
        const deleteResponse = await httpClient.delete<T>(endpoint);
        return deleteResponse.data;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // Get all available brokers with connection status
  async getAvailableBrokers(): Promise<AvailableBrokersResponse> {
    return this.makeRequest<AvailableBrokersResponse>(`${this.baseUrl}/available`, 'GET');
  }

  // Initiate broker connection - get login URL
  async connectBroker(brokerId: string): Promise<BrokerConnectionResponse> {
    return this.makeRequest<BrokerConnectionResponse>(`${this.baseUrl}/connect/${brokerId}`, 'POST');
  }

  // Force connect to broker (disconnects existing sessions)
  async forceConnectBroker(
    brokerId: string
  ): Promise<BrokerConnectionResponse> {
    return this.makeRequest<BrokerConnectionResponse>(`${this.baseUrl}/force-connect/${brokerId}`, 'POST');
  }

  // Complete broker authentication after OAuth callback
  async completeBrokerAuth(
    brokerId: string,
    requestToken: string
  ): Promise<BrokerCallbackResponse> {
    return this.makeRequest<BrokerCallbackResponse>(`${this.baseUrl}/callback/${brokerId}`, 'POST', { request_token: requestToken });
  }

  // Get active broker session for dashboard
  async getActiveSession(): Promise<ActiveSessionResponse> {
    return this.makeRequest<ActiveSessionResponse>(`${this.baseUrl}/active-session`, 'GET');
  }

  // Disconnect specific broker
  async disconnectBroker(brokerId: string): Promise<DisconnectBrokerResponse> {
    return this.makeRequest<DisconnectBrokerResponse>(`${this.baseUrl}/disconnect/${brokerId}`, 'DELETE');
  }

  // Get all connected brokers
  async getConnectedBrokers(): Promise<{
    connectedBrokers: ActiveBrokerSession[];
  }> {
    return this.makeRequest<{ connectedBrokers: ActiveBrokerSession[] }>(`${this.baseUrl}/connected`, 'GET');
  }
}

// Create singleton instance
export const brokerApiService = new BrokerApiService();
export default brokerApiService;
