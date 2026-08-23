import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cuentas from './pages/Cuentas'
import Ingresos from './pages/Ingresos'
import Gastos from './pages/Gastos'
import Creditos from './pages/Creditos'
import Transferencias from './pages/Transferencias'
import Mantenimientos from './pages/Mantenimientos'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cuentas" element={<Cuentas />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/creditos" element={<Creditos />} />
            <Route path="/transferencias" element={<Transferencias />} />
            <Route path="/mantenimientos" element={<Mantenimientos />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
