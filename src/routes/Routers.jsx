import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import Home from '../pages/Home.jsx'
import Quotations from '../pages/Quotations.jsx'
import QuotationHistory from '../pages/QuotationHistory.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

const Routers = ({ user, onLogin }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={onLogin} user={user} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <ProtectedRoute user={user}>
            <Quotations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotation-history"
        element={
          <ProtectedRoute user={user}>
            <QuotationHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? '/' : '/login'} replace />}
      />
    </Routes>
  )
}

export default Routers

