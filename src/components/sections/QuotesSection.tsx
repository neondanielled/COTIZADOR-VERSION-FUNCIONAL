import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Eye,
  FileDown,
  MessageCircle,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Calendar,
  Layers,
  Cpu,
  Truck,
  Building2,
} from 'lucide-react';
import { SavedQuote, QuoteStatus } from '../../types/quote';
import { formatARS } from '../../utils/currency';
import { generateQuotePDF } from '../../services/pdfGenerator';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ProportionalDiagram } from './quote/ProportionalDiagram';

interface QuotesSectionProps {
  quotes: SavedQuote[];
  onEditQuote: (quote: SavedQuote) => void;
  onDuplicateQuote: (id: string) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: QuoteStatus) => Promise<void>;
  onNavigateToQuoteBuilder: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  enviado: { label: 'Enviado', icon: Send, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  aceptado: { label: 'Aceptado', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  rechazado: { label: 'Rechazado', icon: XCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
};

export const QuotesSection: React.FC<QuotesSectionProps> = ({
  quotes,
  onEditQuote,
  onDuplicateQuote,
  onDeleteQuote,
  onUpdateStatus,
  onNavigateToQuoteBuilder,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<SavedQuote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<SavedQuote | null>(null);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchNum = q.quoteNumber.toLowerCase().includes(term);
        const matchClient = q.clientSnapshot.name.toLowerCase().includes(term);
        const matchDesc = q.formData.signDescription.toLowerCase().includes(term);
        if (!matchNum && !matchClient && !matchDesc) return false;
      }

      if (statusFilter !== 'all' && q.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [quotes, searchTerm, statusFilter]);

  const handleDownloadPDF = (quote: SavedQuote) => {
    generateQuotePDF(quote, false);
  };

  const handleOpenWhatsApp = (quote: SavedQuote) => {
    const phone = quote.clientSnapshot.phone ? quote.clientSnapshot.phone.replace(/[^0-9]/g, '') : '';
    const depPct = quote.businessSnapshot.depositPercentage ?? 50;
    const finalPrice = quote.calculationResult.finalPrice;
    const depAmt = Math.round(finalPrice * (depPct / 100));
    const balAmt = Math.max(0, finalPrice - depAmt);

    const message =
      `Hola ${quote.clientSnapshot.name}, te compartimos el presupuesto ${quote.quoteNumber} para tu cartel LED Neón "${quote.formData.signDescription}".\n\n` +
      `• Total del trabajo: ${formatARS(finalPrice)}\n` +
      `• Seña para inicio de fabricación (${depPct}%): ${formatARS(depAmt)}\n` +
      `• Saldo contra entrega: ${formatARS(balAmt)}\n\n` +
      `¡Quedamos a tu disposición para avanzar con la fabricación!`;

    const text = encodeURIComponent(message);
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      await onDeleteQuote(quoteToDelete.id);
      setQuoteToDelete(null);
      if (selectedQuoteDetail?.id === quoteToDelete.id) {
        setSelectedQuoteDetail(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Historial de Presupuestos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control comercial, estados, descarga de PDF profesional y consulta de cotizaciones emitidas con precios congelados.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToQuoteBuilder}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (PR-0001), cliente o cartel..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Segmented Status Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              Todos ({quotes.length})
            </button>
            {(['pendiente', 'enviado', 'aceptado', 'rechazado'] as QuoteStatus[]).map((st) => {
              const cfg = STATUS_CONFIG[st];
              const count = quotes.filter((q) => q.status === st).length;
              const isSelected = statusFilter === st;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className="font-mono text-[11px] opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quotes Table or Empty State */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {quotes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Aún no hay presupuestos guardados
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Creá tu primera cotización en el Cotizador y hacé clic en "Guardar Presupuesto" para archivarla con precios congelados y generar el PDF.
            </p>
            <button
              onClick={onNavigateToQuoteBuilder}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ir al Cotizador</span>
            </button>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm text-slate-300 font-medium">
              No se encontraron presupuestos para los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">N° Presupuesto</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Cartel / Trabajo</th>
                  <th className="px-4 py-3 font-semibold text-right">Total (ARS)</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredQuotes.map((quote) => {
                  const formattedDate = new Date(quote.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const statusInfo = STATUS_CONFIG[quote.status];

                  return (
                    <tr
                      key={quote.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Quote Number */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-bold text-cyan-400">
                          {quote.quoteNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">
                          {quote.clientSnapshot.name || 'Cliente Particular'}
                        </div>
                        {quote.clientSnapshot.phone && (
                          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                            {quote.clientSnapshot.phone}
                          </div>
                        )}
                      </td>

                      {/* Sign Description */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-100 font-medium truncate max-w-xs">
                          {quote.formData.signDescription || 'Cartel Neón'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {quote.formData.widthCm}×{quote.formData.heightCm} cm · {quote.formData.neonMeters}m
                        </div>
                      </td>

                      {/* Total in ARS */}
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-slate-100 tabular-nums">
                        {formatARS(quote.calculationResult.finalPrice)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5 text-center">
                        <select
                          value={quote.status}
                          onChange={(e) => onUpdateStatus(quote.id, e.target.value as QuoteStatus)}
                          className={`text-xs font-semibold py-1 px-2.5 rounded-lg border focus:outline-none transition-colors cursor-pointer bg-slate-900 ${statusInfo.color}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="enviado">Enviado</option>
                          <option value="aceptado">Aceptado</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedQuoteDetail(quote)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ver detalle del presupuesto"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(quote)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Descargar presupuesto en PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(quote)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Compartir por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateQuote(quote.id)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Duplicar como nueva cotización"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuote(quote)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Cargar copia en el Cotizador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuoteToDelete(quote)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar presupuesto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between">
          <span>{filteredQuotes.length} presupuestos en el registro</span>
          <span className="text-[11px] text-slate-500">
            Los precios y costos se conservan congelados según el momento de emisión
          </span>
        </div>
      </div>

      {/* Modal: Detalle Completo del Presupuesto */}
      {selectedQuoteDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuoteDetail(null)}
          title={`Presupuesto ${selectedQuoteDetail.quoteNumber}`}
          subtitle={`Emitido el ${new Date(selectedQuoteDetail.createdAt).toLocaleDateString('es-AR')} · Estado: ${STATUS_CONFIG[selectedQuoteDetail.status].label}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header summary banner */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Cliente del Trabajo
                </span>
                <div className="text-base font-bold text-white">
                  {selectedQuoteDetail.clientSnapshot.name || 'Cliente Particular'}
                </div>
                {selectedQuoteDetail.clientSnapshot.phone && (
                  <div className="text-xs text-slate-400 font-mono">
                    WhatsApp: {selectedQuoteDetail.clientSnapshot.phone}
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Precio Total Congelado
                </span>
                <div className="text-2xl font-extrabold font-mono text-cyan-400 tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.finalPrice)}
                </div>
              </div>
            </div>

            {/* Proportional Diagram and Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <ProportionalDiagram
                widthCm={selectedQuoteDetail.formData.widthCm as number}
                heightCm={selectedQuoteDetail.formData.heightCm as number}
                hasAcrylic={selectedQuoteDetail.formData.hasAcrylic}
                neonType={selectedQuoteDetail.formData.neonType}
                neonMeters={selectedQuoteDetail.formData.neonMeters as number}
              />

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                  Especificaciones Técnicas
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Cartel:</span>
                  <span className="font-medium text-right truncate max-w-[150px]">
                    {selectedQuoteDetail.formData.signDescription || 'LED Neón'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Medidas:</span>
                  <span className="font-mono tabular-nums">
                    {selectedQuoteDetail.formData.widthCm}×{selectedQuoteDetail.formData.heightCm} cm
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Superficie base:</span>
                  <span className="font-mono tabular-nums">
                    {selectedQuoteDetail.calculationResult.acrylicAreaM2.toFixed(3)} m²
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Metros de neón:</span>
                  <span className="font-mono tabular-nums">
                    {selectedQuoteDetail.formData.neonMeters} m
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Instalación:</span>
                  <span>{selectedQuoteDetail.formData.installationType === 'exterior' ? 'Exterior IP67' : 'Interior'}</span>
                </div>
                {selectedQuoteDetail.formData.notes && (
                  <div className="pt-1 border-t border-slate-800 text-slate-400">
                    <span className="font-semibold text-slate-300">Notas:</span> {selectedQuoteDetail.formData.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Frozen Calculations Breakdown */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex justify-between">
                <span>Desglose de Costos Históricos</span>
                <span className="font-mono text-cyan-400">
                  Multiplicador: ×{selectedQuoteDetail.calculationResult.multiplier.toString().replace('.', ',')}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Subtotal Materiales (M):</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.materialsSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mano de Obra ({selectedQuoteDetail.calculationResult.laborPercentage}%):</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.laborCost)}
                </span>
              </div>
              {selectedQuoteDetail.calculationResult.structureCost > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Estructura / Bastidor:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {formatARS(selectedQuoteDetail.calculationResult.structureCost)}
                  </span>
                </div>
              )}
              {selectedQuoteDetail.calculationResult.otherCostsTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Insumos fijos y otros costos:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {formatARS(selectedQuoteDetail.calculationResult.otherCostsTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-slate-800">
                <span>Costo Base:</span>
                <span className="font-mono tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.baseCost)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Venta antes de envío:</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.sellingPriceBeforeShipping)}
                </span>
              </div>
              {selectedQuoteDetail.calculationResult.shippingCost > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Envío y embalaje:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {formatARS(selectedQuoteDetail.calculationResult.shippingCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1 border-t border-slate-800">
                <span>Total Final al Cliente:</span>
                <span className="font-mono tabular-nums">
                  {formatARS(selectedQuoteDetail.calculationResult.finalPrice)}
                </span>
              </div>
            </div>

            {/* Deposit & Balance Commercial Pill */}
            {(() => {
              const depPct = selectedQuoteDetail.businessSnapshot.depositPercentage ?? 50;
              const finalPrice = selectedQuoteDetail.calculationResult.finalPrice;
              const depAmt = Math.round(finalPrice * (depPct / 100));
              const balAmt = Math.max(0, finalPrice - depAmt);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-[11px] font-semibold text-cyan-400 block">
                      Seña para Inicio ({depPct}%)
                    </span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {formatARS(depAmt)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Para dar inicio a la fabricación
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Saldo Restante ({100 - depPct}%)
                    </span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {formatARS(balAmt)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Contra entrega del cartel
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Actions inside modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedQuoteDetail)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(selectedQuoteDetail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEditQuote(selectedQuoteDetail);
                    setSelectedQuoteDetail(null);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
                >
                  Modificar cotización
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteDetail(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation: Delete Quote */}
      <ConfirmDialog
        isOpen={quoteToDelete !== null}
        onClose={() => setQuoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Presupuesto"
        message={`¿Estás seguro de que deseas eliminar permanentemente el presupuesto "${quoteToDelete?.quoteNumber}"? Esta acción no se puede deshacer y el número de cotización no se reutilizará.`}
        confirmLabel="Eliminar presupuesto"
        cancelLabel="Conservar presupuesto"
        isDestructive={true}
      />
    </div>
  );
};
