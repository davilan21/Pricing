import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import type { Parameter, CommissionStructure } from '../types';
import { LEAD_SOURCE_LABELS } from '../lib/utils';

interface ParamForm {
  TRM: string;
  ICA_RATE: string;
  INCOME_TAX_RATE: string;
  CC_RATE: string;
  HOURS_PER_MONTH: string;
  GROSS_MARGIN_TARGET: string;
  NET_MARGIN_TARGET: string;
}

export default function AdminParameters() {
  const [params, setParams] = useState<ParamForm>({
    TRM: '', ICA_RATE: '', INCOME_TAX_RATE: '', CC_RATE: '',
    HOURS_PER_MONTH: '', GROSS_MARGIN_TARGET: '', NET_MARGIN_TARGET: '',
  });
  const [commissions, setCommissions] = useState<CommissionStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingComm, setSavingComm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/parameters').then(({ data }) => {
      const map: Record<string, string> = {};
      (data.parameters as Parameter[]).forEach((p: Parameter) => { map[p.key] = p.value; });
      setParams({
        TRM: map.TRM || '3550',
        ICA_RATE: String(parseFloat(map.ICA_RATE || '0.0069') * 100),
        INCOME_TAX_RATE: String(parseFloat(map.INCOME_TAX_RATE || '0') * 100),
        CC_RATE: String(parseFloat(map.CC_RATE || '0.029') * 100),
        HOURS_PER_MONTH: map.HOURS_PER_MONTH || '180',
        GROSS_MARGIN_TARGET: String(parseFloat(map.GROSS_MARGIN_TARGET || '0.4') * 100),
        NET_MARGIN_TARGET: String(parseFloat(map.NET_MARGIN_TARGET || '0.2') * 100),
      });
      setCommissions(data.commissions);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveParams = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(''); setSuccess('');
    try {
      await api.put('/parameters', {
        parameters: [
          { key: 'TRM', value: params.TRM },
          { key: 'ICA_RATE', value: String(parseFloat(params.ICA_RATE) / 100) },
          { key: 'INCOME_TAX_RATE', value: String(parseFloat(params.INCOME_TAX_RATE) / 100) },
          { key: 'CC_RATE', value: String(parseFloat(params.CC_RATE) / 100) },
          { key: 'HOURS_PER_MONTH', value: params.HOURS_PER_MONTH },
          { key: 'GROSS_MARGIN_TARGET', value: String(parseFloat(params.GROSS_MARGIN_TARGET) / 100) },
          { key: 'NET_MARGIN_TARGET', value: String(parseFloat(params.NET_MARGIN_TARGET) / 100) },
        ],
      });
      setSuccess('Parámetros guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al guardar los parámetros');
    } finally {
      setSaving(false);
    }
  };

  const handleCommChange = (id: string, field: 'referido' | 'kam', value: string) => {
    setCommissions(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: parseFloat(value) / 100 };
      updated.total = updated.referido + updated.kam;
      return updated;
    }));
  };

  const handleSaveCommissions = async () => {
    setSavingComm(true);
    setError(''); setSuccess('');
    try {
      await api.put('/parameters/commissions', {
        commissions: commissions.map(c => ({
          leadSource: c.leadSource, referido: c.referido, kam: c.kam, total: c.total,
        })),
      });
      setSuccess('Comisiones guardadas correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al guardar las comisiones');
    } finally {
      setSavingComm(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const field = (label: string, key: keyof ParamForm, suffix: string, help?: string) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" value={params[key]}
          onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}
          step="any"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{suffix}</span>
      </div>
      {help && <p className="text-xs text-text-muted mt-1">{help}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parámetros del Sistema</h1>
        <p className="text-sm text-text-muted mt-0.5">Configura los valores financieros usados en los cálculos</p>
      </div>

      {success && <div className="bg-green-50 text-success text-sm p-3 rounded-lg border border-green-200">{success}</div>}
      {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

      {/* Financial params */}
      <form onSubmit={handleSaveParams}>
        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-text-muted">Parámetros Financieros</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {field('TRM (COP/USD)', 'TRM', 'COP', 'Tasa representativa del mercado')}
            {field('ICA', 'ICA_RATE', '%', 'Impuesto de Industria y Comercio (ej: 0.69)')}
            {field('Impuesto de Renta', 'INCOME_TAX_RATE', '%', 'Porcentaje de impuesto de renta')}
            {field('Comisión Tarjeta de Crédito', 'CC_RATE', '%', 'Cargo por pago con TC (ej: 2.9)')}
            {field('Horas por Mes', 'HOURS_PER_MONTH', 'h', 'Horas laborales mensuales por persona')}
          </div>

          <hr className="border-border" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-text-muted">Márgenes por Defecto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Gross Margin Objetivo', 'GROSS_MARGIN_TARGET', '%', 'Margen bruto objetivo por defecto')}
            {field('Net Margin Objetivo', 'NET_MARGIN_TARGET', '%', 'Margen neto objetivo por defecto')}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : 'Guardar Parámetros'}
            </button>
          </div>
        </div>
      </form>

      {/* Commission structure */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-text-muted">Política de Comisiones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-hover rounded-lg">
                <th className="text-left px-4 py-2.5 font-medium rounded-l-lg">Fuente de Lead</th>
                <th className="text-center px-4 py-2.5 font-medium">Referido (%)</th>
                <th className="text-center px-4 py-2.5 font-medium">KAM (%)</th>
                <th className="text-center px-4 py-2.5 font-medium rounded-r-lg">Total (%)</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{LEAD_SOURCE_LABELS[c.leadSource]}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" value={(c.referido * 100).toFixed(2)}
                      onChange={e => handleCommChange(c.id, 'referido', e.target.value)}
                      step="0.01" min="0" max="100"
                      className="w-24 mx-auto block text-center px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number" value={(c.kam * 100).toFixed(2)}
                      onChange={e => handleCommChange(c.id, 'kam', e.target.value)}
                      step="0.01" min="0" max="100"
                      className="w-24 mx-auto block text-center px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">
                    {(c.total * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSaveCommissions} disabled={savingComm} className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
            {savingComm ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {savingComm ? 'Guardando...' : 'Guardar Comisiones'}
          </button>
        </div>
      </div>
    </div>
  );
}
