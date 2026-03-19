import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../lib/api';
import { Quote, QuoteStatus } from '../types';
import {
  formatCOP, formatUSD, formatPercent,
  STATUS_LABELS, STATUS_COLORS,
  BUSINESS_LINE_LABELS, CONTRACT_TYPE_LABELS, LEAD_SOURCE_LABELS,
} from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const ALL_STATUSES: QuoteStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'];

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/quotes/${id}`).then(({ data }) => setQuote(data)).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    setChangingStatus(true);
    try {
      const { data } = await api.patch(`/quotes/${quote.id}/status`, { status: newStatus });
      setQuote(data);
    } catch {
      alert('Error al cambiar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!quote) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cotización no encontrada. <Link to="/quotes" className="text-primary hover:underline">Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/quotes" className="p-2 rounded-lg hover:bg-surface-hover">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{quote.code}</h1>
            <p className="text-sm text-text-muted">
              Creada el {new Date(quote.createdAt).toLocaleDateString('es-CO')}
              {quote.creator && ` por ${quote.creator.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[quote.status]}`}>
            {STATUS_LABELS[quote.status]}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
          >
            <Printer size={16} /> Export PDF
          </button>
          {isAdmin && (
            <select
              value={quote.status}
              onChange={e => handleStatusChange(e.target.value as QuoteStatus)}
              disabled={changingStatus}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Client & Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-3">Cliente</h2>
          {quote.client ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Nombre</span><Link to={`/clients/${quote.client.id}`} className="text-primary hover:underline">{quote.client.name}</Link></div>
              <div className="flex justify-between"><span className="text-text-muted">Empresa</span><span>{quote.client.company}</span></div>
              {quote.client.email && <div className="flex justify-between"><span className="text-text-muted">Email</span><span>{quote.client.email}</span></div>}
              {quote.client.phone && <div className="flex justify-between"><span className="text-text-muted">Teléfono</span><span>{quote.client.phone}</span></div>}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Sin información del cliente</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-3">Configuración</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Línea de Negocio</span><span>{BUSINESS_LINE_LABELS[quote.businessLine]}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Duración</span><span>{quote.durationMonths} mes(es)</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Contrato Vendedor</span><span>{CONTRACT_TYPE_LABELS[quote.sellerContractType]}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Fuente del Lead</span><span>{LEAD_SOURCE_LABELS[quote.leadSource]}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Comisión</span><span>{formatPercent(quote.commissionRate)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Pago T.C.</span><span>{quote.creditCardPayment ? 'Sí' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Factoring</span><span>{quote.factoring ? 'Sí' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Staff Augmentation</span><span>{quote.staffAugmentation ? 'Sí' : 'No'}</span></div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      {quote.teamMembers && quote.teamMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Equipo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left px-5 py-3 font-medium">Rol</th>
                  <th className="text-right px-5 py-3 font-medium">Dedicación</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Contrato</th>
                  <th className="text-right px-5 py-3 font-medium">Horas</th>
                  <th className="text-right px-5 py-3 font-medium">Costo/Mes (COP)</th>
                  <th className="text-right px-5 py-3 font-medium">Costo Total (COP)</th>
                </tr>
              </thead>
              <tbody>
                {quote.teamMembers.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">{m.roleName}</td>
                    <td className="px-5 py-3 text-right">{formatPercent(m.dedication)}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">{CONTRACT_TYPE_LABELS[m.contractType]}</td>
                    <td className="px-5 py-3 text-right">{m.hours?.toFixed(0) || '-'}</td>
                    <td className="px-5 py-3 text-right">{formatCOP(m.costMonthly)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCOP(m.costTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-blue-700 mb-3">Gross Margin</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Target Gross Margin</span><span className="font-medium">{formatPercent(quote.targetGrossMargin)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Precio Total COP</span><span className="font-bold">{formatCOP(quote.grossMarginPriceCop || 0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Precio Total USD</span><span className="font-bold text-primary">{formatUSD(quote.grossMarginPriceUsd || 0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">USD/Hora</span><span>{formatUSD(quote.grossMarginHourlyUsd || 0)}</span></div>
            {quote.resultingNetMargin != null && (
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-text-muted">Net Margin Resultante</span>
                <span className={`font-medium ${quote.resultingNetMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(quote.resultingNetMargin)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-purple-700 mb-3">Net Margin</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Target Net Margin</span><span className="font-medium">{formatPercent(quote.targetNetMargin || 0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Precio Total COP</span><span className="font-bold">{formatCOP(quote.netMarginPriceCop || 0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Precio Total USD</span><span className="font-bold text-primary">{formatUSD(quote.netMarginPriceUsd || 0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">USD/Hora</span><span>{formatUSD(quote.netMarginHourlyUsd || 0)}</span></div>
            {quote.resultingGrossMargin != null && (
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-text-muted">Gross Margin Resultante</span>
                <span className={`font-medium ${quote.resultingGrossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(quote.resultingGrossMargin)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-3">Resumen de Costos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-text-muted">Costo Equipo/Mes</p>
            <p className="font-bold">{formatCOP(quote.teamCostMonthly || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Costo Total</p>
            <p className="font-bold">{formatCOP(quote.teamCostTotal || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">TRM</p>
            <p className="font-bold">{formatCOP(quote.trmRate)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Horas/Mes</p>
            <p className="font-bold">{quote.hoursPerMonth}h</p>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-3">Tasas y Deducciones</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-muted">ICA</p>
            <p className="font-medium">{formatPercent(quote.icaRate)}</p>
          </div>
          <div>
            <p className="text-text-muted">Renta</p>
            <p className="font-medium">{formatPercent(quote.incomeTaxRate)}</p>
          </div>
          <div>
            <p className="text-text-muted">Tarjeta de Crédito</p>
            <p className="font-medium">{formatPercent(quote.ccRate)}</p>
          </div>
          <div>
            <p className="text-text-muted">Comisión</p>
            <p className="font-medium">{formatCOP(quote.commissionAmount || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
