import './App.css';
import TradingCalculator from './containers/TradingCalculator';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const { isLoading } = useSettings();

  return (
    <AuthGuard>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && <TradingCalculator />}
    </AuthGuard>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
