import React from 'react';
import ReactDOM from 'react-dom/client';
import AutoDeployEngine from './app.jsx';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AutoDeployEngine />
  </React.StrictMode>,
);
