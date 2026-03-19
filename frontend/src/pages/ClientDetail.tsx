import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, X, FileText, PlusCircle } from 'lucide-react';
import api from '../lib/api';
import type { Client, Quote } from '../types';
import { formatUSD, STATUS_LABELS, STATUS_COLORS, BUSINESS_LINE_LABELS } from '../lib/utils';

interface ClientForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ClientForm>({ name: '', company: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchClient = () => {
    setLoading(true);
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/quotes?clientId=${id}`),
    ]).then(([clientRes, quotesRes]) => {
      setClient(clientRes.data);
      setQuotes(quotesRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); }, [id]);

  const openEdit = () => {
    if (!client) return;
    setForm({ name: client.name, company: client.company, email: client.email || '', phone: client.phone || '', notes: client.notes || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim()) { setError('Nombre y empresa son requeridos'); return; }
    setSaving(true);
    setError('');
    try {
      await api.put(`/clients/${id}`, form);
      setShowModal(false);
      fetchClient();
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Cliente no encontrado.</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-primary hover:underline text-sm">Volver a Clientes</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-text-muted">{client.company}</p>
        </div>
        <button onClick={openEdit} className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
          <Pencil size={15} /> Editar
        </button>
      </div>

      {/* Client info */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-text-muted mb-1">Nombre</p>
            <p className="font-medium">{client.name}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Empresa</p>
            <p className="font-medium">{client.company}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Email</p>
            <p className="font-medium">{client.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Teléfono</p>
            <p className="font-medium">{client.phone || '—'}</p>
          </div>
          {client.notes && (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs text-text-muted mb-1">Notas</p>
              <p className="text-sm">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quotes */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={16} className="text-text-muted" />
            Cotizaciones ({quotes.length})
          </h2>
          <Link to={`/quotes/new?clientId=${client.id}`} className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            <PlusCircle size={14} /> Nueva
          </Link>
        </div>
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Aún no hay cotizaciones para este cliente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover">
                  <th className="text-left px-5 py-3 font-medium">Código</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Línea</th>
                  <th className="text-left px-5 py-3 font-medium">Total (USD)</th>
                  <th className="text-left px-5 py-3 font-medium">Estado</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id} className="border-t border-border hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                    <td className="px-5 py-3 font-mono text-xs font-medium text-primary">{q.code}</td>
                    <td className="px-5 py-3 text-text-muted hidden sm:table-cell">{BUSINESS_LINE_LABELS[q.businessLine]}</td>
                    <td className="px-5 py-3 font-medium">{formatUSD(q.grossMarginPriceUsd ?? q.netMarginPriceUsd ?? 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
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

      {/* Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Editar Cliente</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa *</label>
                  <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
