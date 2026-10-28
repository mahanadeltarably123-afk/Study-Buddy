import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import './index.css';

// Polyfill for process.env to prevent crashes in browser environments
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.process) window.process = { env: {} };
  // @ts-ignore
  if (!window.process.env) window.process.env = {};
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element");
}