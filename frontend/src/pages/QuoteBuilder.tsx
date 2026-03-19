import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, Layers, Check } from 'lucide-react';
import api from '../lib/api';
import {
  RoleCatalog, Client, TeamTemplate, CommissionStructure, Parameter,
  ContractType, LeadSource, BusinessLine, CalculationResult
} from '../types';
import {
  formatCOP, formatUSD, formatPercent, CONTRACT_TYPE_LABELS,
  LEAD_SOURCE_LABELS, BUSINESS_LINE_LABELS
} from '../lib/utils';

interface TeamMember {
  roleId: string;
  roleName: string;
  baseSalary: number;
  companyCost: number;
  dedication: number;
  contractType: ContractType;
}

interface QuoteConfig {
  clientId: string;
  businessLine: BusinessLine;
  durationMonths: number;
  sellerContractType: ContractType;
  leadSource: LeadSource;
  commissionRate: number;
  creditCardPayment: boolean;
  factoring: boolean;
  staffAugmentation: boolean;
  targetGrossMargin: number;
  targetNetMargin: number;
}

export default function QuoteBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [roles, setRoles] = useState<RoleCatalog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TeamTemplate[]>([]);
  const [commissions, setCommissions] = useState<CommissionStructure[]>([]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  // Quote state
  const [config, setConfig] = useState<QuoteConfig>({
    clientId: '',
    businessLine: 'EQUIPO_DEDICADO',
    durationMonths: 1,
    sellerContractType: 'PRESTACION_SERVICIOS',
    leadSource: 'DIRECTO',
    commissionRate: 0.1,
    creditCardPayment: false,
    factoring: false,
    staffAugmentation: false,
    targetGrossMargin: 0.5,
    targetNetMargin: 0.2,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/roles'),
      api.get('/clients'),
      api.get('/templates'),
      api.get('/parameters'),
    ]).then(([rolesRes, clientsRes, templatesRes, paramsRes]) => {
      setRoles(rolesRes.data);
      setClients(clientsRes.data);
      setTemplates(templatesRes.data);
      setCommissions(paramsRes.data.commissions);
      const p: Record<string, string> = {};
      paramsRes.data.parameters.forEach((param: Parameter) => { p[param.key] = param.value; });
      setParams(p);
      // Set default margins from params
      setConfig(prev => ({
        ...prev,
        targetGrossMargin: parseFloat(p.GROSS_MARGIN_TARGET || '0.5'),
        targetNetMargin: parseFloat(p.NET_MARGIN_TARGET || '0.2'),
      }));
    });
  }, []);

  // Auto-fill commission from lead source
  useEffect(() => {
    const comm = commissions.find(c => c.leadSource === config.leadSource);
    if (comm) {
      setConfig(prev => ({ ...prev, commissionRate: comm.total }));
    }
  }, [config.leadSource, commissions]);

  // Calculate on step 3
  const doCalculation = useCallback(async () => {
    if (teamMembers.length === 0) return;
    try {
      const { data } = await api.post('/quotes/calculate', {
        teamMembers: teamMembers.map(m => ({
          roleName: m.roleName,
          baseSalary: m.baseSalary,
          companyCost: m.companyCost,
          dedication: m.dedication,
          contractType: m.contractType,
        })),
        durationMonths: config.durationMonths,
        targetGrossMargin: config.targetGrossMargin,
        targetNetMargin: config.targetNetMargin,
        commissionRate: config.commissionRate,
        creditCardPayment: config.creditCardPayment,
      });
      setCalculation(data);
    } catch (err) {
      console.error('Calculation error', err);
    }
  }, [teamMembers, config]);

  useEffect(() => {
    if (step === 3) doCalculation();
  }, [step, doCalculation]);

  const addMember = (role: RoleCatalog) => {
    setTeamMembers(prev => [...prev, {
      roleId: role.id,
      roleName: role.name,
      baseSalary: role.baseSalary,
      companyCost: role.companyCost,
      dedication: 1.0,
      contractType: 'PRESTACION_SERVICIOS',
    }]);
  };

  const removeMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: string, value: any) => {
    setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const loadTemplate = (template: TeamTemplate) => {
    const members = template.members.map(m => ({
      roleId: m.roleId,
      roleName: m.role.name,
      baseSalary: m.role.baseSalary,
      companyCost: m.role.companyCost,
      dedication: m.dedication,
      contractType: m.contractType,
    }));
    setTeamMembers(members);
    setShowTemplates(false);
  };

  const handleCreateClient = async () => {
    try {
      const { data } = await api.post('/clients', newClient);
      setClients(prev => [data, ...prev]);
      setConfig(prev => ({ ...prev, clientId: data.id }));
      setShowNewClient(false);
      setNewClient({ name: '', company: '', email: '', phone: '' });
    } catch {
      alert('Error al crear cliente');
    }
  };

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    setSaving(true);
    try {
      const { data } = await api.post('/quotes', {
        ...config,
        status,
        teamMembers: teamMembers.map(m => ({
          roleId: m.roleId,
          dedication: m.dedication,
          contractType: m.contractType,
        })),
      });
      navigate(`/quotes/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la cotización');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return config.clientId && config.durationMonths > 0;
    if (step === 2) return teamMembers.length > 0;
    return true;
  };

  const teamCostMonthly = teamMembers.reduce((sum, m) => {
    const cost = m.companyCost > 0 ? m.companyCost : m.baseSalary;
    return sum + cost * m.dedication;
  }, 0);

  const totalHours = teamMembers.reduce((sum, m) => sum + 180 * m.dedication, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-hover">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Nueva Cotización</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-border p-4">
        {['Configuración', 'Equipo', 'Pricing', 'Revisar'].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 < step ? 'bg-success text-white' :
              i + 1 === step ? 'bg-primary text-white' :
              'bg-gray-100 text-text-muted'
            }`}>
              {i + 1 < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i + 1 === step ? 'font-medium' : 'text-text-muted'}`}>{label}</span>
            {i < 3 && <div className="flex-1 h-px bg-border hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-lg font-semibold">Configuración de la Cotización</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <div className="flex gap-2">
                <select
                  value={config.clientId}
                  onChange={e => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  className="flex-1 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
                </select>
                <button onClick={() => setShowNewClient(true)} className="px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Línea de Negocio</label>
              <select
                value={config.businessLine}
                onChange={e => setConfig(prev => ({ ...prev, businessLine: e.target.value as BusinessLine }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.entries(BUSINESS_LINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duración (meses) *</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={config.durationMonths}
                onChange={e => setConfig(prev => ({ ...prev, durationMonths: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contrato del Vendedor</label>
              <select
                value={config.sellerContractType}
                onChange={e => setConfig(prev => ({ ...prev, sellerContractType: e.target.value as ContractType }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.entries(CONTRACT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fuente del Lead</label>
              <select
                value={config.leadSource}
                onChange={e => setConfig(prev => ({ ...prev, leadSource: e.target.value as LeadSource }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comisión (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={(config.commissionRate * 100).toFixed(1)}
                onChange={e => setConfig(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) / 100 || 0 }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Gross Margin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={(config.targetGrossMargin * 100).toFixed(0)}
                onChange={e => setConfig(prev => ({ ...prev, targetGrossMargin: parseFloat(e.target.value) / 100 || 0 }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Net Margin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={(config.targetNetMargin * 100).toFixed(0)}
                onChange={e => setConfig(prev => ({ ...prev, targetNetMargin: parseFloat(e.target.value) / 100 || 0 }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { key: 'creditCardPayment' as const, label: 'Pago con T.C.' },
              { key: 'factoring' as const, label: 'Factoring' },
              { key: 'staffAugmentation' as const, label: 'Staff Augmentation' },
            ].map(toggle => (
              <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[toggle.key]}
                  onChange={e => setConfig(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm">{toggle.label}</span>
              </label>
            ))}
          </div>

          {/* New Client Modal */}
          {showNewClient && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-lg font-semibold">Nuevo Cliente</h3>
                <input placeholder="Nombre *" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg" />
                <input placeholder="Empresa *" value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg" />
                <input placeholder="Email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg" />
                <input placeholder="Teléfono" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewClient(false)} className="px-4 py-2 border border-border rounded-lg">Cancelar</button>
                  <button onClick={handleCreateClient} disabled={!newClient.name || !newClient.company}
                    className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Crear</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Team Composition */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <h2 className="text-lg font-semibold">Composición del Equipo</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-surface-hover">
                  <Layers size={14} /> Cargar Plantilla
                </button>
              </div>
            </div>

            <p className="text-sm text-text-muted mb-4">
              Por cada Dev: PM 33%, QA 20%, Diseño 10%
            </p>

            {/* Add member */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">Agregar Miembro</label>
              <select
                onChange={e => {
                  const role = roles.find(r => r.id === e.target.value);
                  if (role) addMember(role);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2.5 border border-border rounded-lg"
                defaultValue=""
              >
                <option value="" disabled>Seleccionar rol...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {formatCOP(r.baseSalary)}</option>
                ))}
              </select>
            </div>

            {/* Team members */}
            <div className="space-y-3">
              {teamMembers.map((member, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{member.roleName}</h4>
                      <p className="text-sm text-text-muted">Salario: {formatCOP(member.baseSalary)} | Costo: {formatCOP(member.companyCost)}</p>
                    </div>
                    <button onClick={() => removeMember(i)} className="p-1.5 text-danger hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Contrato</label>
                      <select
                        value={member.contractType}
                        onChange={e => updateMember(i, 'contractType', e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded text-sm"
                      >
                        {Object.entries(CONTRACT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Dedicación (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        step="5"
                        value={(member.dedication * 100).toFixed(0)}
                        onChange={e => updateMember(i, 'dedication', parseFloat(e.target.value) / 100 || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-4 text-sm">
                      <div>
                        <span className="text-xs text-text-muted block">Horas</span>
                        <span className="font-medium">{(180 * member.dedication).toFixed(0)}h</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted block">Costo/Mes</span>
                        <span className="font-medium">{formatCOP((member.companyCost || member.baseSalary) * member.dedication)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  Agrega miembros al equipo o carga una plantilla
                </div>
              )}
            </div>

            {/* Totals */}
            {teamMembers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-6">
                <div>
                  <span className="text-sm text-text-muted">Costo Mensual Equipo</span>
                  <p className="text-lg font-bold">{formatCOP(teamCostMonthly)}</p>
                </div>
                <div>
                  <span className="text-sm text-text-muted">Total Horas</span>
                  <p className="text-lg font-bold">{totalHours}h</p>
                </div>
                <div>
                  <span className="text-sm text-text-muted">Costo Total ({config.durationMonths}m)</span>
                  <p className="text-lg font-bold">{formatCOP(teamCostMonthly * config.durationMonths)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Template Modal */}
          {showTemplates && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Seleccionar Plantilla</h3>
                <div className="space-y-3">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left border border-border rounded-lg p-4 hover:bg-surface-hover transition-colors"
                    >
                      <h4 className="font-medium">{t.name}</h4>
                      {t.description && <p className="text-sm text-text-muted">{t.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {t.members.map(m => (
                          <span key={m.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {m.role.name} ({(m.dedication * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowTemplates(false)} className="mt-4 w-full py-2 border border-border rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && calculation && (
        <div className="space-y-4">
          {/* Two scenarios side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gross Margin Scenario */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-700">Jugar con Gross Margin</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  calculation.resultingNetMargin >= config.targetNetMargin
                    ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {calculation.resultingNetMargin >= config.targetNetMargin ? 'Dentro del margen' : '!Por debajo!'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Gross Margin</span>
                  <span className="font-medium">{formatPercent(config.targetGrossMargin)}</span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Precio Total COP</span>
                    <span className="font-bold">{formatCOP(calculation.grossMarginPriceCop)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Precio Total USD</span>
                    <span className="font-bold text-primary">{formatUSD(calculation.grossMarginPriceUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Mensual USD</span>
                    <span>{formatUSD(calculation.grossMarginMonthlyPriceUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">USD/Hora</span>
                    <span>{formatUSD(calculation.grossMarginHourlyUsd)}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Comisión</span>
                    <span>{formatCOP(calculation.grossMarginCommission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">ICA</span>
                    <span>{formatCOP(calculation.grossMarginIca)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Net Margin Resultante</span>
                    <span className={calculation.resultingNetMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(calculation.resultingNetMargin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Margin Scenario */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-700">Jugar con Net Margin</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  calculation.resultingGrossMargin >= config.targetGrossMargin
                    ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {calculation.resultingGrossMargin >= config.targetGrossMargin ? 'Dentro del margen' : '!Por debajo!'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Net Margin</span>
                  <span className="font-medium">{formatPercent(config.targetNetMargin)}</span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Precio Total COP</span>
                    <span className="font-bold">{formatCOP(calculation.netMarginPriceCop)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Precio Total USD</span>
                    <span className="font-bold text-primary">{formatUSD(calculation.netMarginPriceUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Mensual USD</span>
                    <span>{formatUSD(calculation.netMarginMonthlyPriceUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">USD/Hora</span>
                    <span>{formatUSD(calculation.netMarginHourlyUsd)}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Comisión</span>
                    <span>{formatCOP(calculation.netMarginCommission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">ICA</span>
                    <span>{formatCOP(calculation.netMarginIca)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Gross Margin Resultante</span>
                    <span className={calculation.resultingGrossMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(calculation.resultingGrossMargin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cost summary */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3">Resumen de Costos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-text-muted">Costo Equipo/Mes</p>
                <p className="font-bold">{formatCOP(calculation.teamCostMonthly)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Costo Total</p>
                <p className="font-bold">{formatCOP(calculation.teamCostTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Horas</p>
                <p className="font-bold">{calculation.totalHours}h</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Duración</p>
                <p className="font-bold">{config.durationMonths} mes(es)</p>
              </div>
            </div>
          </div>

          {/* Per-member breakdown */}
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Desglose por Miembro (USD - Gross Margin)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left px-5 py-3 font-medium">Rol</th>
                  <th className="text-right px-5 py-3 font-medium">Dedicación</th>
                  <th className="text-right px-5 py-3 font-medium">Horas</th>
                  <th className="text-right px-5 py-3 font-medium">USD/Hora</th>
                  <th className="text-right px-5 py-3 font-medium">Total USD</th>
                </tr>
              </thead>
              <tbody>
                {calculation.members.map((m, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">{m.roleName}</td>
                    <td className="px-5 py-3 text-right">{formatPercent(m.dedication)}</td>
                    <td className="px-5 py-3 text-right">{m.hours.toFixed(0)}</td>
                    <td className="px-5 py-3 text-right">{formatUSD(m.pricePerHourGrossUsd)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatUSD(m.priceTotalGrossUsd)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-hover font-medium">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-5 py-3 text-right"></td>
                  <td className="px-5 py-3 text-right">{calculation.totalHours}</td>
                  <td className="px-5 py-3 text-right">{formatUSD(calculation.grossMarginHourlyUsd)}</td>
                  <td className="px-5 py-3 text-right">{formatUSD(calculation.grossMarginPriceUsd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Adjust margins */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3">Ajustar Márgenes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gross Margin (%)</label>
                <input
                  type="number" min="0" max="100" step="1"
                  value={(config.targetGrossMargin * 100).toFixed(0)}
                  onChange={e => {
                    setConfig(prev => ({ ...prev, targetGrossMargin: parseFloat(e.target.value) / 100 || 0 }));
                  }}
                  onBlur={doCalculation}
                  className="w-full px-3 py-2.5 border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Net Margin (%)</label>
                <input
                  type="number" min="0" max="100" step="1"
                  value={(config.targetNetMargin * 100).toFixed(0)}
                  onChange={e => {
                    setConfig(prev => ({ ...prev, targetNetMargin: parseFloat(e.target.value) / 100 || 0 }));
                  }}
                  onBlur={doCalculation}
                  className="w-full px-3 py-2.5 border border-border rounded-lg"
                />
              </div>
            </div>
            <button onClick={doCalculation} className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark">
              Recalcular
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Save */}
      {step === 4 && calculation && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Resumen de la Cotización</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-text-muted">Configuración</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Cliente</span><span>{clients.find(c => c.id === config.clientId)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Línea</span><span>{BUSINESS_LINE_LABELS[config.businessLine]}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Duración</span><span>{config.durationMonths} mes(es)</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Lead Source</span><span>{LEAD_SOURCE_LABELS[config.leadSource]}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Comisión</span><span>{formatPercent(config.commissionRate)}</span></div>
                  {config.creditCardPayment && <div className="flex justify-between"><span className="text-text-muted">Pago T.C.</span><span>Sí</span></div>}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-text-muted">Pricing (Gross Margin)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Precio Total</span><span className="font-bold">{formatUSD(calculation.grossMarginPriceUsd)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Mensual</span><span>{formatUSD(calculation.grossMarginMonthlyPriceUsd)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">USD/Hora</span><span>{formatUSD(calculation.grossMarginHourlyUsd)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Gross Margin</span><span>{formatPercent(config.targetGrossMargin)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Net Margin</span><span>{formatPercent(calculation.resultingNetMargin)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-text-muted mb-2">Equipo</h3>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((m, i) => (
                  <span key={i} className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                    {m.roleName} ({formatPercent(m.dedication)})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-lg font-medium hover:bg-surface-hover disabled:opacity-50"
            >
              <Save size={16} /> Guardar Borrador
            </button>
            <button
              onClick={() => handleSave('SENT')}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              <Check size={16} /> Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-surface-hover">
            <ArrowLeft size={16} /> Anterior
          </button>
        ) : <div />}
        {step < 4 && (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            Siguiente <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
