import './App.css';
import TradingCalculator from './containers/TradingCalculator';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <TradingCalculator />
    </SettingsProvider>
  );
}

export default App;
