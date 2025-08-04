import KiteIcon from '../assets/kite .png';

export interface BrokerIconConfig {
  icon?: string;
  emoji?: string;
  name: string;
}

export const brokerIconMap: Record<string, BrokerIconConfig> = {
  kite: {
    icon: KiteIcon,
    name: 'Kite by Zerodha'
  },
  groww: {
    emoji: '📈',
    name: 'Groww'
  },
  angelone: {
    emoji: '⚡',
    name: 'Angel One'
  },
  upstox: {
    emoji: '🚀',
    name: 'Upstox'
  },
  // Add more brokers as needed
};

export const getBrokerIcon = (brokerId: string): BrokerIconConfig => {
  return brokerIconMap[brokerId] || {
    emoji: '🏛️',
    name: 'Broker'
  };
};

export const getBrokerDisplayName = (brokerId: string, fallbackName?: string): string => {
  const config = getBrokerIcon(brokerId);
  return config.name || fallbackName || brokerId;
};