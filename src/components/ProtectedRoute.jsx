import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-gray-500">
        Cargando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
