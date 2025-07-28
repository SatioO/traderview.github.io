import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gttService, type GTTTrigger, type GTTStatus } from '../../services/gttService';

interface GTTManagementProps {
  className?: string;
}

const GTTManagement: React.FC<GTTManagementProps> = ({ className = '' }) => {
  const queryClient = useQueryClient();
  const [selectedGTT, setSelectedGTT] = useState<GTTTrigger | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch all GTT triggers
  const { data: gttData, isLoading, error, refetch } = useQuery({
    queryKey: ['gtt-triggers'],
    queryFn: () => gttService.getAllGTT(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });

  // Delete GTT mutation
  const deleteMutation = useMutation({
    mutationFn: (triggerId: number) => gttService.deleteGTT(triggerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtt-triggers'] });
    },
    onError: (error) => {
      console.error('Failed to delete GTT:', error);
    },
  });

  const handleDeleteGTT = async (triggerId: number, tradingsymbol: string) => {
    if (window.confirm(`Are you sure you want to delete GTT for ${tradingsymbol}?`)) {
      try {
        await deleteMutation.mutateAsync(triggerId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusColor = (status: GTTStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/10 border-green-400/20';
      case 'triggered':
        return 'text-blue-400 bg-blue-500/10 border-blue-400/20';
      case 'disabled':
        return 'text-gray-400 bg-gray-500/10 border-gray-400/20';
      case 'expired':
        return 'text-orange-400 bg-orange-500/10 border-orange-400/20';
      case 'cancelled':
      case 'deleted':
        return 'text-red-400 bg-red-500/10 border-red-400/20';
      case 'rejected':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-400/20';
    }
  };

  const getStatusIcon = (status: GTTStatus) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'triggered':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-400">Loading GTT orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="p-4 bg-red-500/10 border border-red-400/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            <span className="text-red-300">Failed to load GTT orders</span>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded border border-red-400/30 hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const gttTriggers = gttData?.data || [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
          GTT Management
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">
            {gttTriggers.length} active triggers
          </span>
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh GTT list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* GTT List */}
      {gttTriggers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-slate-300 mb-2">No GTT Orders</h4>
          <p className="text-sm text-slate-400">
            GTT orders will appear here when you place orders with stop loss or target prices.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gttTriggers.map((gtt) => (
            <div
              key={gtt.trigger_id}
              className="p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-violet-400/20 backdrop-blur-sm"
            >
              {/* GTT Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-white">
                    {gtt.condition.tradingsymbol}
                  </div>
                  <div className="text-sm text-slate-400">
                    {gtt.condition.exchange}
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded border flex items-center space-x-1 ${getStatusColor(gtt.status)}`}>
                    {getStatusIcon(gtt.status)}
                    <span className="uppercase">{gtt.status}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-slate-400">
                    ID: {gtt.trigger_id}
                  </div>
                  {gtt.status === 'active' && (
                    <button
                      onClick={() => handleDeleteGTT(gtt.trigger_id, gtt.condition.tradingsymbol)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      title="Delete GTT"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* GTT Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trigger Conditions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-300">Trigger Conditions</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white font-medium uppercase">{gtt.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Price:</span>
                      <span className="text-white">₹{gtt.condition.last_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Trigger Price(s):</span>
                      <div className="text-right">
                        {gtt.condition.trigger_values.map((price, index) => (
                          <div key={index} className="text-yellow-300 font-medium">
                            ₹{price.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-300">Orders ({gtt.orders.length})</div>
                  <div className="space-y-2">
                    {gtt.orders.map((order, index) => (
                      <div key={index} className="p-2 bg-slate-800/30 rounded border border-slate-600/30">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${order.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                              {order.transaction_type}
                            </span>
                            <span className="text-slate-400">
                              {order.quantity} @ {order.order_type}
                            </span>
                          </div>
                          {order.price && (
                            <span className="text-white font-medium">
                              ₹{order.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {order.product} • {order.exchange}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-600/30">
                <span>Created: {new Date(gtt.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(gtt.updated_at).toLocaleString()}</span>
              </div>

              {/* Status Message */}
              <div className="mt-2 text-xs text-slate-300 p-2 bg-slate-800/20 rounded">
                {gttService.getStatusMessage(gtt.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GTTManagement;