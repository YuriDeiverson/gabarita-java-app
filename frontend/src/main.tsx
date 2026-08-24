import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import {AuthProvider,useAuth} from './auth/AuthContext.tsx';
import {secureError} from './security/secureLogger.ts';
import './index.css';
import './premium.css';
import './wide-layout.css';
import './responsive.css';

if (import.meta.env.PROD) {
  window.addEventListener('error', event => {
    secureError('runtime.unhandled-error', event.error);
    event.preventDefault();
  });
  window.addEventListener('unhandledrejection', event => {
    secureError('runtime.unhandled-rejection', event.reason);
    event.preventDefault();
  });
}

function AuthenticatedRoot(){
  const {session,loading}=useAuth();
  if(loading)return <div className="auth-loading"><span/><p>Validando sua sessão…</p></div>;
  return session?<App/>:<AuthPage/>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><AuthenticatedRoot/></AuthProvider>
  </StrictMode>,
);
