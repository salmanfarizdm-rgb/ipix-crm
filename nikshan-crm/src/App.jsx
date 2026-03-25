import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth.js'
import Layout from './components/Layout.jsx'

const Login        = lazy(() => import('./pages/Login.jsx'))
const Dashboard    = lazy(() => import('./pages/Dashboard.jsx'))
const Customers    = lazy(() => import('./pages/Customers.jsx'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail.jsx'))
const Leads        = lazy(() => import('./pages/Leads.jsx'))
const Purchases    = lazy(() => import('./pages/Purchases.jsx'))
const EMITracker   = lazy(() => import('./pages/EMITracker.jsx'))
const ServiceReqs  = lazy(() => import('./pages/ServiceRequests.jsx'))
const FollowUps    = lazy(() => import('./pages/FollowUps.jsx'))
const TeamPerf     = lazy(() => import('./pages/TeamPerformance.jsx'))
const Reports      = lazy(() => import('./pages/Reports.jsx'))

const Spin = () => <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div>

function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spin />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="leads" element={<Leads />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="emi" element={<EMITracker />} />
            <Route path="service" element={<ServiceReqs />} />
            <Route path="followups" element={<FollowUps />} />
            <Route path="performance" element={<ProtectedRoute roles={['admin','branch_manager','sales_manager']}><TeamPerf /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute roles={['admin','branch_manager']}><Reports /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
