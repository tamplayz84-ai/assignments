import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import POSBilling from './pages/POSBilling';
import SalesHistory from './pages/SalesHistory';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function Page({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
      <Route path="/pos" element={<Page><POSBilling /></Page>} />
      <Route path="/products" element={<Page><Products /></Page>} />
      <Route path="/categories" element={<Page><Categories /></Page>} />
      <Route path="/inventory" element={<Page><Inventory /></Page>} />
      <Route path="/customers" element={<Page><Customers /></Page>} />
      <Route path="/sales-history" element={<Page><SalesHistory /></Page>} />
      <Route path="/reports" element={<Page adminOnly><Reports /></Page>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
