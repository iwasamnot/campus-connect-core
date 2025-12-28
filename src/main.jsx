import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <PreferencesProvider>
          <AuthProvider>
            <PresenceProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </PresenceProvider>
          </AuthProvider>
        </PreferencesProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
)

