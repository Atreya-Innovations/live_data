import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Global uncaught error handler
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason);
});

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#5A1530;font-family:Inter,sans-serif"><h2>Application Error</h2><p>Root element not found. Please reload the page.</p></div>';
} else {
  createRoot(root).render(<App />);
}
