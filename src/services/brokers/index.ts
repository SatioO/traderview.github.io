// Broker registry and factory
import type { BrokerAuthProvider } from '../../types/broker';
import { KiteBrokerService } from './KiteBrokerService';

// Registry of all available brokers
const brokerRegistry: Record<string, () => BrokerAuthProvider> = {
  kite: () => new KiteBrokerService(),
};

// Factory function to create broker instances
export function createBrokerService(brokerName: string): BrokerAuthProvider {
  const BrokerClass = brokerRegistry[brokerName];
  if (!BrokerClass) {
    throw new Error(`Broker '${brokerName}' is not supported`);
  }
  return BrokerClass();
}

// Get all available and enabled brokers
export function getAvailableBrokers(): BrokerAuthProvider[] {
  return Object.keys(brokerRegistry)
    .map(name => createBrokerService(name))
    .filter(broker => broker.validateConfig());
}

// Get broker by name
export function getBrokerService(brokerName: string): BrokerAuthProvider {
  return createBrokerService(brokerName);
}

// Export broker classes for direct use if needed
export { KiteBrokerService };
export type { BrokerAuthProvider } from '../../types/broker';