import React from 'react';
import ReactDOM from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App.tsx';

import './style.css';

i18n.options.defaultNS = 'popup'; // NOTE: Set 'popup' as default namespace for this entrypoint.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
