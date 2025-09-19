import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { singleInstanceClient } from './utils/SingleInstanceClient'

// Check for single instance before rendering
singleInstanceClient.checkAndActivate().then((isActive) => {
  if (isActive) {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
  // If not active, the SingleInstanceClient will show the duplicate tab warning
})