import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {AuthProvider} from './context/AuthContext.tsx';
import {SchoolProvider} from './context/SchoolContext.jsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SchoolProvider>
        <App />
      </SchoolProvider>
    </AuthProvider>
  </StrictMode>,
);
