import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import LoadingScreen from '../LoadingScreen';

type AuthModalType = 'login' | 'signup' | 'forgotPassword' | null;

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentModal, setCurrentModal] = useState<AuthModalType>('login');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setCurrentModal('login');
    } else if (isAuthenticated) {
      setCurrentModal(null);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginModal
          isOpen={currentModal === 'login'}
          onClose={() => setCurrentModal('login')}
          onSwitchToSignup={() => setCurrentModal('signup')}
          onSwitchToForgotPassword={() => setCurrentModal('forgotPassword')}
        />
        <SignupModal
          isOpen={currentModal === 'signup'}
          onClose={() => setCurrentModal('login')}
          onSwitchToLogin={() => setCurrentModal('login')}
        />
        <ForgotPasswordModal
          isOpen={currentModal === 'forgotPassword'}
          onClose={() => setCurrentModal('login')}
          onSwitchToLogin={() => setCurrentModal('login')}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;