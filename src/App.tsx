import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import AppRoutes from './routes/AppRoutes';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const { isLoading } = useSettings();

  return (
    <AuthGuard>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && <AppRoutes />}
    </AuthGuard>
  );
}

function App() {
  const basename = import.meta.env.MODE === 'development' 
    ? '/' 
    : import.meta.env.VITE_BASE_PATH || '/';

  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
