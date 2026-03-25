import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth'

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore()

  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  return children
}
