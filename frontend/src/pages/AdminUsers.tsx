import { useState, useEffect } from 'react';
import { PlusCircle, X, Pencil, PowerOff } from 'lucide-react';
import api from '../lib/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'COMMERCIAL';
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'COMMERCIAL' };

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Nombre y email son requeridos'); return; }
    if (!editingUser && !form.password.trim()) { setError('La contraseña es requerida para nuevos usuarios'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: Partial<UserForm> = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password;
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    if (user.id === currentUser?.id) return;
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
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
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-text-muted mt-0.5">Gestiona los accesos al sistema</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <PlusCircle size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Rol</th>
                <th className="text-center px-5 py-3 font-medium hidden sm:table-cell">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={`border-b border-border last:border-0 transition-colors ${user.isActive ? 'hover:bg-surface-hover' : 'opacity-50 bg-gray-50'}`}>
                  <td className="px-5 py-3 font-medium">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Tú</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{user.email}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'ADMIN' ? 'Administrador' : 'Comercial'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleActive(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'hover:bg-red-50 text-text-muted hover:text-danger' : 'hover:bg-green-50 text-text-muted hover:text-success'}`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <PowerOff size={15} />
                        </button>
                      )}
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
              <h2 className="text-lg font-semibold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="usuario@imagineapps.co" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contraseña {editingUser && <span className="text-text-muted font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'ADMIN' | 'COMMERCIAL' }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="COMMERCIAL">Comercial</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
