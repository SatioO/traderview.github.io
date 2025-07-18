import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../LoadingScreen';

const BrokerCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { brokerName } = useParams<{ brokerName: string }>();
  const { handleBrokerCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processBrokerCallback = async () => {
      try {
        if (!brokerName) {
          setError('Missing broker name');
          return;
        }

        const requestToken = searchParams.get('request_token');
        const authCode = searchParams.get('code');
        const state = searchParams.get('state');
        const action = searchParams.get('action');

        // Prepare callback data based on broker type
        const callbackData = {
          broker: brokerName,
          state: state || undefined,
          requestToken: requestToken || undefined,
          authCode: authCode || undefined,
        };

        if (action === 'login' && (requestToken || authCode)) {
          await handleBrokerCallback(callbackData);
          navigate('/', { replace: true });
        } else if (action === 'login') {
          setError(`Missing authentication token from ${brokerName}`);
        } else {
          setError('Invalid callback parameters');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        setIsProcessing(false);
      }
    };

    processBrokerCallback();
  }, [searchParams, handleBrokerCallback, navigate, brokerName]);

  if (isProcessing) {
    return <LoadingScreen isLoading={true} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Authentication Error</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-md transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BrokerCallback;