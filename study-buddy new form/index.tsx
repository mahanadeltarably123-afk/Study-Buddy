import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfill for process.env to prevent crashes in browser environments
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.process) window.process = { env: {} };
  // @ts-ignore
  if (!window.process.env) window.process.env = {};
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
