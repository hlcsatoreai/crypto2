import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket errors that can't be fully disabled in this environment
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    (event.reason.message && event.reason.message.includes('WebSocket')) ||
    (event.reason.stack && event.reason.stack.includes('vite'))
  )) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('WebSocket')) {
    event.preventDefault();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
