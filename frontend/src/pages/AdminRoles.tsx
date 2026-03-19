import { useState, useEffect } from 'react';
import { PlusCircle, X, Pencil, PowerOff } from 'lucide-react';
import api from '../lib/api';
import type { RoleCatalog } from '../types';
import { formatCOP } from '../lib/utils';

interface RoleForm {
  name: string;
  baseSalary: string;
  companyCost: string;
}

const emptyForm: RoleForm = { name: '', baseSalary: '', companyCost: '' };

export default function AdminRoles() {
  const [roles, setRoles] = useState<RoleCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleCatalog | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchRoles = () => {
    setLoading(true);
    api.get('/roles/all').then(({ data }) => setRoles(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoles(); }, []);

  const displayed = roles.filter(r => showInactive ? true : r.isActive);

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (role: RoleCatalog) => {
    setEditingRole(role);
    setForm({ name: role.name, baseSalary: String(role.baseSalary), companyCost: String(role.companyCost) });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseFloat(form.baseSalary);
    const cost = parseFloat(form.companyCost);
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (isNaN(salary) || salary <= 0) { setError('El salario base debe ser mayor a 0'); return; }
    if (isNaN(cost) || cost <= 0) { setError('El costo empresa debe ser mayor a 0'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, { name: form.name, baseSalary: salary, companyCost: cost });
      } else {
        await api.post('/roles', { name: form.name, baseSalary: salary, companyCost: cost });
      }
      setShowModal(false);
      fetchRoles();
    } catch {
      setError('Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (role: RoleCatalog) => {
    try {
      await api.put(`/roles/${role.id}`, { isActive: !role.isActive });
      fetchRoles();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Roles</h1>
          <p className="text-sm text-text-muted mt-0.5">Gestiona los perfiles y sus costos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <PlusCircle size={16} /> Nuevo Rol
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Mostrar roles inactivos
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-right px-5 py-3 font-medium">Salario Base</th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Costo Empresa</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(role => (
                <tr key={role.id} className={`border-b border-border last:border-0 transition-colors ${role.isActive ? 'hover:bg-surface-hover' : 'opacity-50 bg-gray-50'}`}>
                  <td className="px-5 py-3 font-medium">{role.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{formatCOP(role.baseSalary)}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm hidden sm:table-cell">{formatCOP(role.companyCost)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {role.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleActive(role)} className={`p-1.5 rounded-lg transition-colors ${role.isActive ? 'hover:bg-red-50 text-text-muted hover:text-danger' : 'hover:bg-green-50 text-text-muted hover:text-success'}`} title={role.isActive ? 'Desactivar' : 'Activar'}>
                        <PowerOff size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Rol *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: Software Developer Senior" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salario Base (COP) *</label>
                <input type="number" value={form.baseSalary} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: 9000000" min="0" step="100000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Costo Empresa (COP) *</label>
                <input type="number" value={form.companyCost} onChange={e => setForm(f => ({ ...f, companyCost: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: 12420000 (salario × 1.38)" min="0" step="100000" />
                <p className="text-xs text-text-muted mt-1">Para Nómina: salario × 1.38 (prestaciones sociales)</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
