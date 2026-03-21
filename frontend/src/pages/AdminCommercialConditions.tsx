import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import type { User, CommercialCondition, BusinessLine } from '../types';
import { BUSINESS_LINE_LABELS } from '../lib/utils';

const BUSINESS_LINES: BusinessLine[] = ['EQUIPO_DEDICADO', 'DESCUBRIMIENTO', 'SPRINT_MVP', 'CASO_EXPRESS'];

interface ConditionForm {
  businessLine: BusinessLine;
  commissionRate: string;
}

export default function AdminCommercialConditions() {
  const [commercials, setCommercials] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [conditions, setConditions] = useState<ConditionForm[]>(
    BUSINESS_LINES.map(bl => ({ businessLine: bl, commissionRate: '0' }))
  );
  const [loading, setLoading] = useState(true);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(({ data }) => {
      const filtered = (data as User[]).filter(u => u.role === 'COMMERCIAL' && u.isActive);
      setCommercials(filtered);
    }).finally(() => setLoading(false));
  }, []);

  const loadConditions = async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setConditions(BUSINESS_LINES.map(bl => ({ businessLine: bl, commissionRate: '0' })));
      return;
    }
    setLoadingConditions(true);
    try {
      const { data } = await api.get(`/commercial-conditions/${userId}`);
      const existing = data as CommercialCondition[];
      setConditions(
        BUSINESS_LINES.map(bl => {
          const found = existing.find(c => c.businessLine === bl);
          return {
            businessLine: bl,
            commissionRate: found ? (found.commissionRate * 100).toFixed(2) : '0',
          };
        })
      );
    } catch {
      setError('Error al cargar las condiciones');
    } finally {
      setLoadingConditions(false);
    }
  };

  const handleChange = (businessLine: BusinessLine, value: string) => {
    setConditions(prev =>
      prev.map(c => c.businessLine === businessLine ? { ...c, commissionRate: value } : c)
    );
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/commercial-conditions/${selectedUserId}`, {
        conditions: conditions.map(c => ({
          businessLine: c.businessLine,
          commissionRate: parseFloat(c.commissionRate) / 100,
        })),
      });
      setSuccess('Condiciones guardadas correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al guardar las condiciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Condiciones Comerciales</h1>
        <p className="text-sm text-text-muted mt-0.5">Configura las comisiones por línea de negocio para cada comercial</p>
      </div>

      {success && <div className="bg-green-50 text-success text-sm p-3 rounded-lg border border-green-200">{success}</div>}
      {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Seleccionar Comercial</label>
          <select
            value={selectedUserId}
            onChange={e => loadConditions(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Selecciona un comercial --</option>
            {commercials.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>

        {selectedUserId && (
          <>
            {loadingConditions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-hover rounded-lg">
                        <th className="text-left px-4 py-2.5 font-medium rounded-l-lg">Línea de Negocio</th>
                        <th className="text-center px-4 py-2.5 font-medium rounded-r-lg">Comisión (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditions.map(c => (
                        <tr key={c.businessLine} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{BUSINESS_LINE_LABELS[c.businessLine]}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={c.commissionRate}
                              onChange={e => handleChange(c.businessLine, e.target.value)}
                              step="0.01"
                              min="0"
                              max="100"
                              className="w-24 mx-auto block text-center px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Guardando...' : 'Guardar Condiciones'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
