import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'not_ready';
  message?: string;
  lastConnected?: number;
  reconnectAttempts?: number;
}

interface StreamingMetrics {
  messagesReceived: number;
  ticksReceived: number;
  errors: number;
  lastActivity: number;
  connectionStartTime: number;
  subscriptionCount: number;
}

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatus;
  metrics?: StreamingMetrics | null;
  className?: string;
  showDetailed?: boolean;
}

const ConnectionStatusComponent: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  metrics,
  className = '',
  showDetailed = false
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return {
          icon: CheckCircle2,
          text: 'Live Data',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-400/30',
          dotColor: 'bg-emerald-400',
          animate: 'animate-pulse'
        };
      
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/30',
          dotColor: 'bg-blue-400',
          animate: 'animate-spin'
        };
      
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: `Reconnecting... (${connectionStatus.reconnectAttempts || 0})`,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-400/30',
          dotColor: 'bg-yellow-400',
          animate: 'animate-spin'
        };
      
      case 'error':
        return {
          icon: XCircle,
          text: 'Connection Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-400/30',
          dotColor: 'bg-red-400',
          animate: 'animate-pulse'
        };
      
      case 'not_ready':
        return {
          icon: AlertTriangle,
          text: 'Service Not Ready',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-400/30',
          dotColor: 'bg-orange-400',
          animate: 'animate-pulse'
        };
      
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/20',
          borderColor: 'border-slate-400/30',
          dotColor: 'bg-slate-400',
          animate: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatUptime = (startTime: number) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatLastActivity = (lastActivity: number) => {
    const timeSince = Date.now() - lastActivity;
    if (timeSince < 1000) return 'Just now';
    if (timeSince < 60000) return `${Math.floor(timeSince / 1000)}s ago`;
    if (timeSince < 3600000) return `${Math.floor(timeSince / 60000)}m ago`;
    return `${Math.floor(timeSince / 3600000)}h ago`;
  };

  if (!showDetailed) {
    // Simple status indicator for header
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.animate}`}></div>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${config.color} ${config.animate}`} />
          <div>
            <div className={`font-semibold ${config.color}`}>
              {config.text}
            </div>
            {connectionStatus.message && (
              <div className="text-xs text-slate-400 mt-1">
                {connectionStatus.message}
              </div>
            )}
          </div>
        </div>
        
        {connectionStatus.status === 'connected' && connectionStatus.lastConnected && (
          <div className="text-xs text-slate-400">
            Connected {formatLastActivity(connectionStatus.lastConnected)}
          </div>
        )}
      </div>

      {metrics && connectionStatus.status === 'connected' && (
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-500">Uptime</div>
            <div className={`font-semibold ${config.color}`}>
              {formatUptime(metrics.connectionStartTime)}
            </div>
          </div>
          
          <div>
            <div className="text-slate-500">Subscriptions</div>
            <div className={`font-semibold ${config.color}`}>
              {metrics.subscriptionCount}
            </div>
          </div>
          
          <div>
            <div className="text-slate-500">Messages</div>
            <div className={`font-semibold ${config.color}`}>
              {metrics.messagesReceived.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div className="text-slate-500">Ticks</div>
            <div className={`font-semibold ${config.color}`}>
              {metrics.ticksReceived.toLocaleString()}
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="text-slate-500">Last Activity</div>
            <div className={`font-semibold ${config.color}`}>
              {formatLastActivity(metrics.lastActivity)}
            </div>
          </div>
          
          {metrics.errors > 0 && (
            <div className="col-span-2">
              <div className="text-slate-500">Errors</div>
              <div className="font-semibold text-red-400">
                {metrics.errors}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusComponent;