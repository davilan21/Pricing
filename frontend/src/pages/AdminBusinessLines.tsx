import { useState, useEffect } from 'react';
import { PlusCircle, X, Pencil, PowerOff, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { BusinessLine } from '../types';

interface LineForm {
  name: string;
}

const emptyForm: LineForm = { name: '' };

export default function AdminBusinessLines() {
  const [lines, setLines] = useState<BusinessLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState<BusinessLine | null>(null);
  const [form, setForm] = useState<LineForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLines = () => {
    setLoading(true);
    api.get('/business-lines').then(({ data }) => setLines(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLines(); }, []);

  const openCreate = () => {
    setEditingLine(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (line: BusinessLine) => {
    setEditingLine(line);
    setForm({ name: line.name });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingLine) {
        await api.put(`/business-lines/${editingLine.id}`, { name: form.name });
      } else {
        await api.post('/business-lines', { name: form.name });
      }
      setShowModal(false);
      setSuccess(editingLine ? 'Línea actualizada' : 'Línea creada');
      setTimeout(() => setSuccess(''), 3000);
      fetchLines();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (line: BusinessLine) => {
    try {
      await api.put(`/business-lines/${line.id}`, { isActive: !line.isActive });
      fetchLines();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (line: BusinessLine) => {
    if (!confirm(`¿Eliminar "${line.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/business-lines/${line.id}`);
      setSuccess('Línea eliminada');
      setTimeout(() => setSuccess(''), 3000);
      fetchLines();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Error al eliminar');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Líneas de Negocio</h1>
          <p className="text-sm text-text-muted mt-0.5">Gestiona las líneas de negocio disponibles para cotizaciones</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <PlusCircle size={16} /> Nueva Línea
        </button>
      </div>

      {success && <div className="bg-green-50 text-success text-sm p-3 rounded-lg border border-green-200">{success}</div>}
      {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.id} className={`border-b border-border last:border-0 transition-colors ${line.isActive ? 'hover:bg-surface-hover' : 'opacity-50 bg-gray-50'}`}>
                  <td className="px-5 py-3 font-medium">{line.name}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${line.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {line.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(line)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleActive(line)}
                        className={`p-1.5 rounded-lg transition-colors ${line.isActive ? 'hover:bg-red-50 text-text-muted hover:text-danger' : 'hover:bg-green-50 text-text-muted hover:text-success'}`}
                        title={line.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <PowerOff size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(line)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-text-muted">No hay líneas de negocio. Crea la primera.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editingLine ? 'Editar Línea' : 'Nueva Línea de Negocio'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: Equipo Dedicado"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : editingLine ? 'Guardar Cambios' : 'Crear Línea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
