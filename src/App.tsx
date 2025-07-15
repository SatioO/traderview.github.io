import './App.css';
import TradingCalculator from './containers/TradingCalculator';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const { isLoading } = useSettings();

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && <TradingCalculator />}
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
