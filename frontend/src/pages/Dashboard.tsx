import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, PlusCircle } from 'lucide-react';
import api from '../lib/api';
import type { DashboardData } from '../types';
import { formatUSD, BUSINESS_LINE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../lib/utils';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (error) {
    return <div className="bg-red-50 text-danger text-sm p-4 rounded-lg">{error}</div>;
  }

  if (!data) return null;

  const cards = [
    { label: 'Total Cotizaciones', value: data.totalQuotes, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    { label: 'Este Mes', value: data.quotesThisMonth, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Valor Total (USD)', value: formatUSD(data.totalValueUsd), icon: Users, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/quotes/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            <PlusCircle size={16} /> Nueva Cotización
          </Link>
          <Link to="/clients" className="flex items-center gap-2 bg-white border border-border text-text px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
            <Users size={16} /> Clientes
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-3">Por Estado</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[key]}`}>
              {label}: {data.statusCounts[key] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Recent quotes */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Cotizaciones Recientes</h2>
        </div>
        {data.recentQuotes.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No hay cotizaciones aún. <Link to="/quotes/new" className="text-primary hover:underline">Crear la primera</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left px-5 py-3 font-medium">Código</th>
                  <th className="text-left px-5 py-3 font-medium">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Línea</th>
                  <th className="text-left px-5 py-3 font-medium">Total USD</th>
                  <th className="text-left px-5 py-3 font-medium">Estado</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.recentQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-hover cursor-pointer">
                    <td className="px-5 py-3">
                      <Link to={`/quotes/${q.id}`} className="text-primary font-medium hover:underline">{q.code}</Link>
                    </td>
                    <td className="px-5 py-3">{q.client?.name || '-'}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">{BUSINESS_LINE_LABELS[q.businessLine]}</td>
                    <td className="px-5 py-3 font-medium">{formatUSD(q.grossMarginPriceUsd || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                        {STATUS_LABELS[q.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell">
                      {new Date(q.createdAt).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
