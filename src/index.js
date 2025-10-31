import * as process from 'process';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './i18n';
import reportWebVitals from './reportWebVitals';
import { Provider as ReduxProvider } from 'react-redux';
import SettingsProvider from './contexts/SettingsContext';
import { store } from './redux/store';
import { Buffer } from 'buffer';

window.global = window;
window.process = process;

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <React.StrictMode>
  <ReduxProvider store={store}>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </ReduxProvider>,
  // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
