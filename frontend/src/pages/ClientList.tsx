import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, X, Pencil } from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';

interface ClientForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyForm: ClientForm = { name: '', company: '', email: '', phone: '', notes: '' };

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = () => {
    setLoading(true);
    api.get('/clients').then(({ data }) => setClients(data)).catch(() => setClients([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (client: Client, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingClient(client);
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
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, form);
      } else {
        await api.post('/clients', form);
      }
      setShowModal(false);
      fetchClients();
    } catch {
      setError('Error al guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <PlusCircle size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {search ? 'No se encontraron clientes.' : 'Aún no hay clientes. ¡Crea el primero!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left px-5 py-3 font-medium">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium">Empresa</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Teléfono</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Cotizaciones</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/clients/${client.id}`} className="font-medium text-primary hover:underline">
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-text-muted">{client.company}</td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell">{client.email || '—'}</td>
                    <td className="px-5 py-3 text-text-muted hidden sm:table-cell">{client.phone || '—'}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {client._count?.quotes ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={e => openEdit(client, e)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa *</label>
                  <input
                    type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Información adicional..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
