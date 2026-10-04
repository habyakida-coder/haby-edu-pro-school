import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {AuthProvider} from './context/AuthContext.tsx';
import {SchoolProvider} from './context/SchoolContext.jsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SchoolProvider>
          <App />
        </SchoolProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
