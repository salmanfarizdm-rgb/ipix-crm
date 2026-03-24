import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Leads from './pages/Leads'
import Purchases from './pages/Purchases'
import EMI from './pages/EMI'
import ServiceRequests from './pages/ServiceRequests'
import FollowUps from './pages/FollowUps'
import Reports from './pages/Reports'

function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
    </div>
  )
  if (!token || !user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe)
  useEffect(() => { fetchMe() }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2236', color: '#fff', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#F97316', secondary: '#fff' } }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="emi" element={<EMI />} />
          <Route path="service" element={<ServiceRequests />} />
          <Route path="followups" element={<FollowUps />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
