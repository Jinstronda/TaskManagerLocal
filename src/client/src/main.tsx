import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { singleInstanceClient } from './utils/SingleInstanceClient'

// Route relative API calls to the backend server when running under Neutralino's internal server
// Dynamic API base to support different ports
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8765'
const originalFetch = window.fetch
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  try {
    if (typeof input === 'string') {
      if (input.startsWith('/api')) {
        return originalFetch(`${API_BASE}${input}`, init)
      }
    } else if (input instanceof Request) {
      if (input.url.startsWith('/api')) {
        const rewritten = new Request(`${API_BASE}${new URL(input.url, 'http://localhost').pathname}`, input)
        return originalFetch(rewritten, init)
      }
    }
  } catch (_) {
    // fall through
  }
  return originalFetch(input as any, init)
}) as typeof window.fetch

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// Check for single instance before rendering, but gracefully degrade if API is unavailable
try {
  const hasBroadcast = typeof (window as any).BroadcastChannel === 'function'
  if (!hasBroadcast) {
    renderApp()
  } else {
    singleInstanceClient.checkAndActivate()
      .then((isActive) => {
        if (isActive) renderApp()
      })
      .catch(() => renderApp())
  }
} catch {
  renderApp()
}