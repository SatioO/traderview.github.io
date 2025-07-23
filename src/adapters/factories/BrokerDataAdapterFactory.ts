import type {
  BrokerDataAdapter,
  BrokerDataAdapterFactory,
  BrokerAdapterConfig,
} from '../ports/BrokerDataAdapter';
import { KiteBrokerDataAdapter } from '../implementations/KiteBrokerDataAdapter';

// Broker adapter registry type
type AdapterConstructor = new (
  config: BrokerAdapterConfig
) => BrokerDataAdapter;

// Registry of available broker adapters
const BROKER_ADAPTERS: Record<string, AdapterConstructor> = {
  kite: KiteBrokerDataAdapter,
  // Future brokers can be added here:
  // zerodha: KiteBrokerDataAdapter, // alias for kite
  // upstox: UpstoxBrokerDataAdapter,
  // angel: AngelBrokerDataAdapter,
  // fyers: FyersBrokerDataAdapter,
};

export class DefaultBrokerDataAdapterFactory
  implements BrokerDataAdapterFactory
{
  /**
   * Creates a broker data adapter instance based on the broker name
   * @param brokerName - Name of the broker (e.g., 'kite', 'upstox')
   * @param config - Configuration for the broker adapter
   * @returns BrokerDataAdapter instance
   * @throws Error if broker is not supported
   */
  createAdapter(
    brokerName: string,
    config: BrokerAdapterConfig
  ): BrokerDataAdapter {
    const normalizedBrokerName = brokerName.toLowerCase().trim();

    if (!this.isBrokerSupported(normalizedBrokerName)) {
      throw new Error(
        `Broker '${brokerName}' is not supported. Supported brokers: ${this.getSupportedBrokers().join(
          ', '
        )}`
      );
    }

    const AdapterClass = BROKER_ADAPTERS[normalizedBrokerName];

    try {
      return new AdapterClass(config);
    } catch (error) {
      throw new Error(
        `Failed to create ${brokerName} adapter: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get list of all supported broker names
   * @returns Array of supported broker names
   */
  getSupportedBrokers(): string[] {
    return Object.keys(BROKER_ADAPTERS);
  }

  /**
   * Check if a broker is supported
   * @param brokerName - Name of the broker to check
   * @returns true if broker is supported, false otherwise
   */
  isBrokerSupported(brokerName: string): boolean {
    const normalizedBrokerName = brokerName.toLowerCase().trim();
    return normalizedBrokerName in BROKER_ADAPTERS;
  }

  /**
   * Register a new broker adapter
   * @param brokerName - Name of the broker
   * @param adapterClass - Constructor for the adapter class
   */
  registerAdapter(brokerName: string, adapterClass: AdapterConstructor): void {
    const normalizedBrokerName = brokerName.toLowerCase().trim();
    BROKER_ADAPTERS[normalizedBrokerName] = adapterClass;
  }

  /**
   * Unregister a broker adapter
   * @param brokerName - Name of the broker to unregister
   */
  unregisterAdapter(brokerName: string): void {
    const normalizedBrokerName = brokerName.toLowerCase().trim();
    delete BROKER_ADAPTERS[normalizedBrokerName];
  }
}

// Singleton instance
export const brokerDataAdapterFactory = new DefaultBrokerDataAdapterFactory();

// Export the factory instance as default
export default brokerDataAdapterFactory;
