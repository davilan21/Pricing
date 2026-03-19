import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import api from '../lib/api';
import type { Quote, QuoteStatus } from '../types';
import { formatUSD, STATUS_LABELS, STATUS_COLORS, BUSINESS_LINE_LABELS } from '../lib/utils';

export default function QuoteList() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');

  useEffect(() => {
    api.get('/quotes').then(({ data }) => setQuotes(data)).finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter(q => {
    const matchesSearch =
      !search ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.company?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Cotizaciones</h1>
        <Link to="/quotes/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <PlusCircle size={16} /> Nueva Cotización
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por código, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as QuoteStatus | '')}
            className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No se encontraron cotizaciones.
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
                {filtered.map((q) => (
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
