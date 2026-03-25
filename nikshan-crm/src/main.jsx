import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#fff', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } }} />
  </React.StrictMode>
)
