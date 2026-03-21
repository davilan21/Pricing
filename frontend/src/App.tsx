import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuoteList from './pages/QuoteList';
import QuoteBuilder from './pages/QuoteBuilder';
import QuoteDetail from './pages/QuoteDetail';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import AdminRoles from './pages/AdminRoles';
import AdminParameters from './pages/AdminParameters';
import AdminUsers from './pages/AdminUsers';
import AdminCommercialConditions from './pages/AdminCommercialConditions';
import type { ReactNode } from 'react';

function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuoteList />} />
            <Route path="/quotes/new" element={<QuoteBuilder />} />
            <Route path="/quotes/:id/edit" element={<QuoteBuilder />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/admin/roles" element={<AdminGuard><AdminRoles /></AdminGuard>} />
            <Route path="/admin/parameters" element={<AdminGuard><AdminParameters /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/commercial-conditions" element={<AdminGuard><AdminCommercialConditions /></AdminGuard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
