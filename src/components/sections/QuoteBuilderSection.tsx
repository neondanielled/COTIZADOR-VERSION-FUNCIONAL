import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  User,
  Phone,
  Ruler,
  Layers,
  Cpu,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Percent,
  Sliders,
  Package,
  Save,
  FileDown,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Material } from '../../types/material';
import { Client } from '../../types/client';
import { BusinessProfile } from '../../types/business';
import {
  QuoteFormData,
  NeonTechnology,
  InstallationEnvironment,
  QuotePowerSupplyItem,
  QuoteSupplyItem,
  QuoteAdditionalCostItem,
  QuoteCalculationResult,
  SavedQuote,
} from '../../types/quote';
import { calculateQuote } from '../../services/quoteCalculator';
import { formatARS } from '../../utils/currency';
import { ProportionalDiagram } from './quote/ProportionalDiagram';
import { generateQuotePDF } from '../../services/pdfGenerator';

interface QuoteBuilderSectionProps {
  materials: Material[];
  businessProfile: BusinessProfile;
  clients: Client[];
  editingQuote?: SavedQuote | null;
  onSaveQuote: (
    formData: QuoteFormData,
    calculationResult: QuoteCalculationResult,
    existingQuoteId?: string
  ) => Promise<SavedQuote>;
  onCancelEdit?: () => void;
  onNavigateToMaterials?: () => void;
  onNavigateToQuotes?: () => void;
}

const DEFAULT_QUOTE_FORM: QuoteFormData = {
  clientName: '',
  clientPhone: '',
  signDescription: '',
  widthCm: 60,
  heightCm: 60,
  installationType: 'interior',
  notes: '',
  neonType: 'neon_comun',
  neonMaterialId: '',
  neonMeters: 5,
  hasAcrylic: true,
  acrylicMaterialId: '',
  powerSupplies: [],
  supplies: [],
  laborPercentage: 0,
  structureCost: 0,
  shippingCost: 0,
  fixedWorkshopCost: 0,
  additionalCosts: [],
  multiplier: 2.0,
  clientId: '',
};

export const QuoteBuilderSection: React.FC<QuoteBuilderSectionProps> = ({
  materials,
  businessProfile,
  clients,
  editingQuote,
  onSaveQuote,
  onCancelEdit,
  onNavigateToMaterials,
  onNavigateToQuotes,
}) => {
  const [formData, setFormData] = useState<QuoteFormData>(DEFAULT_QUOTE_FORM);
  const [customMultiplierInput, setCustomMultiplierInput] = useState<string>('');
  const [isCustomMultiplier, setIsCustomMultiplier] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessQuote, setSaveSuccessQuote] = useState<SavedQuote | null>(null);

  // If editing an existing quote, initialize form with its saved state
  useEffect(() => {
    if (editingQuote) {
      setFormData(editingQuote.formData);
      if (![2.0, 2.5, 3.0].includes(editingQuote.formData.multiplier)) {
        setIsCustomMultiplier(true);
        setCustomMultiplierInput(editingQuote.formData.multiplier.toString());
      } else {
        setIsCustomMultiplier(false);
      }
    } else {
      setFormData(DEFAULT_QUOTE_FORM);
      setIsCustomMultiplier(false);
      setCustomMultiplierInput('');
    }
  }, [editingQuote]);

  // Filtered materials by category
  const neonMaterials = useMemo(
    () => materials.filter((m) => m.category === 'Neón LED Flex'),
    [materials]
  );
  const acrylicMaterials = useMemo(
    () => materials.filter((m) => m.category === 'Acrílico'),
    [materials]
  );
  const powerMaterials = useMemo(
    () => materials.filter((m) => m.category === 'Fuentes de alimentación'),
    [materials]
  );
  const supplyMaterials = useMemo(
    () => materials.filter((m) => m.category === 'Insumos'),
    [materials]
  );

  // Auto-select first active material if none selected and not editing
  useEffect(() => {
    if (editingQuote) return;
    setFormData((prev) => {
      let updated = false;
      const next = { ...prev };

      if (!next.neonMaterialId && neonMaterials.length > 0) {
        const firstActiveNeon = neonMaterials.find((m) => m.isActive) || neonMaterials[0];
        if (firstActiveNeon) {
          next.neonMaterialId = firstActiveNeon.id;
          updated = true;
        }
      }

      if (!next.acrylicMaterialId && acrylicMaterials.length > 0) {
        const firstActiveAcrylic =
          acrylicMaterials.find((m) => m.isActive) || acrylicMaterials[0];
        if (firstActiveAcrylic) {
          next.acrylicMaterialId = firstActiveAcrylic.id;
          updated = true;
        }
      }

      return updated ? next : prev;
    });
  }, [neonMaterials, acrylicMaterials, editingQuote]);

  // Execute Centralized Calculation
  const result = useMemo(
    () => calculateQuote(formData, materials),
    [formData, materials]
  );

  // Helper form field updater
  const updateField = <K extends keyof QuoteFormData>(key: K, value: QuoteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Helper number input updater
  const handleNumericInput = (
    key: keyof QuoteFormData,
    inputValue: string,
    allowDecimal: boolean = true
  ) => {
    if (inputValue === '') {
      updateField(key, '' as any);
      return;
    }
    const sanitized = inputValue.replace(',', '.');
    const parsed = allowDecimal ? parseFloat(sanitized) : parseInt(sanitized, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateField(key, parsed as any);
    }
  };

  // Select client from dropdown
  const handleSelectClient = (clientId: string) => {
    if (!clientId) {
      updateField('clientId', '');
      return;
    }
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientPhone: found.whatsapp || prev.clientPhone,
      }));
    }
  };

  // Power supplies management
  const handleAddPowerSupply = () => {
    const defaultMat = powerMaterials.find((m) => m.isActive) || powerMaterials[0] || materials[0];
    const newItem: QuotePowerSupplyItem = {
      id: `ps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId: defaultMat ? defaultMat.id : '',
      quantity: 1,
    };
    updateField('powerSupplies', [...formData.powerSupplies, newItem]);
  };

  const handleUpdatePowerSupply = (
    id: string,
    field: keyof QuotePowerSupplyItem,
    value: string | number
  ) => {
    const updated = formData.powerSupplies.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('powerSupplies', updated);
  };

  const handleRemovePowerSupply = (id: string) => {
    updateField(
      'powerSupplies',
      formData.powerSupplies.filter((item) => item.id !== id)
    );
  };

  // Supplies management
  const handleAddSupply = () => {
    const defaultMat = supplyMaterials.find((m) => m.isActive) || supplyMaterials[0] || materials[0];
    const newItem: QuoteSupplyItem = {
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId: defaultMat ? defaultMat.id : '',
      quantity: 1,
    };
    updateField('supplies', [...formData.supplies, newItem]);
  };

  const handleUpdateSupply = (
    id: string,
    field: keyof QuoteSupplyItem,
    value: string | number
  ) => {
    const updated = formData.supplies.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('supplies', updated);
  };

  const handleRemoveSupply = (id: string) => {
    updateField(
      'supplies',
      formData.supplies.filter((item) => item.id !== id)
    );
  };

  // Additional costs management
  const handleAddAdditionalCost = () => {
    const newItem: QuoteAdditionalCostItem = {
      id: `add_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: 'Costo adicional',
      amount: 0,
    };
    updateField('additionalCosts', [...formData.additionalCosts, newItem]);
  };

  const handleUpdateAdditionalCost = (
    id: string,
    field: keyof QuoteAdditionalCostItem,
    value: string | number
  ) => {
    const updated = formData.additionalCosts.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('additionalCosts', updated);
  };

  const handleRemoveAdditionalCost = (id: string) => {
    updateField(
      'additionalCosts',
      formData.additionalCosts.filter((item) => item.id !== id)
    );
  };

  // Multiplier handler
  const handleSelectMultiplier = (value: number) => {
    setIsCustomMultiplier(false);
    updateField('multiplier', value);
  };

  const handleCustomMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(',', '.');
    setCustomMultiplierInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      updateField('multiplier', parsed);
    }
  };

  // Reset form
  const handleResetForm = () => {
    if (editingQuote && onCancelEdit) {
      onCancelEdit();
    }
    setFormData(DEFAULT_QUOTE_FORM);
    setIsCustomMultiplier(false);
    setCustomMultiplierInput('');
    setSaveSuccessQuote(null);
  };

  // Save Quote Action
  const handleSave = async (andDownloadPDF: boolean = false) => {
    setIsSaving(true);
    try {
      const saved = await onSaveQuote(formData, result, editingQuote?.id);
      setSaveSuccessQuote(saved);
      if (andDownloadPDF) {
        generateQuotePDF(saved, false);
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-cyan-400" />
            <span>Motor de Cotización Neón</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculá el costo exacto de materiales en ARS, mano de obra, adicionales y precio de venta
            aplicando el multiplicador comercial del taller.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editingQuote && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar edición</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar cotizador</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : editingQuote ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}</span>
          </button>
        </div>
      </div>

      {/* Editing quote active banner */}
      {editingQuote && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-300">
              Modificando Presupuesto {editingQuote.quoteNumber}
            </span>
            <span>· Creado originalmente el {new Date(editingQuote.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
          <span className="text-[11px] text-cyan-400">
            Los cambios actualizarán este presupuesto manteniendo su número histórico
          </span>
        </div>
      )}

      {/* Save Success Banner with Quick Actions */}
      {saveSuccessQuote && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Presupuesto <strong>{saveSuccessQuote.quoteNumber}</strong> guardado exitosamente con precios congelados.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => generateQuotePDF(saveSuccessQuote, false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            {onNavigateToQuotes && (
              <button
                type="button"
                onClick={onNavigateToQuotes}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors"
              >
                <span>Ver en Presupuestos</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Warnings Banner if any */}
      {result.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Atención: Verificaciones de materiales</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Grid: Left Form (7 cols on lg) vs Right Summary & Diagram (5 cols on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Bloque A: Datos del Cliente y del Trabajo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>A. Cliente y Descripción del Cartel</span>
              </h3>

              {clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Cliente registrado:</span>
                  <select
                    value={formData.clientId || ''}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-300 focus:outline-none"
                  >
                    <option value="">Seleccionar o escribir nuevo...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre del cliente <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    placeholder="Ej: Sofía Gómez / Bar Central"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp del cliente
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.clientPhone}
                    onChange={(e) => updateField('clientPhone', e.target.value)}
                    placeholder="+54 9 11 5555-4321"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre o frase del cartel
                </label>
                <input
                  type="text"
                  value={formData.signDescription}
                  onChange={(e) => updateField('signDescription', e.target.value)}
                  placeholder="Ej: 'OPEN' con taza de café en neón cálido y rojo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Dimensiones */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ancho del cartel en centímetros <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.widthCm}
                    onChange={(e) => handleNumericInput('widthCm', e.target.value)}
                    placeholder="Ej: 60"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alto del cartel en centímetros <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.heightCm}
                    onChange={(e) => handleNumericInput('heightCm', e.target.value)}
                    placeholder="Ej: 30"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              {/* Instalación */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo de instalación
                </label>
                <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateField('installationType', 'interior')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      formData.installationType === 'interior'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Interior
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('installationType', 'exterior')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      formData.installationType === 'exterior'
                        ? 'bg-slate-800 text-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Exterior (IP67)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Observaciones técnicas
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Ej: Salida de cable oculta por letra O"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Bloque B: Tipo de Neón y Metros Lineales */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <Ruler className="w-4 h-4 text-cyan-400" />
                <span>B. Neón LED Flex y Metros Consumidos</span>
              </h3>
              {neonMaterials.length === 0 && onNavigateToMaterials && (
                <button
                  type="button"
                  onClick={onNavigateToMaterials}
                  className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium"
                >
                  <span>Cargar neón en Materiales</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Opciones de Neón */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateField('neonType', 'neon_comun')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  formData.neonType === 'neon_comun'
                    ? 'bg-slate-800 border-cyan-500 text-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Neón Común
              </button>
              <button
                type="button"
                onClick={() => updateField('neonType', 'neon_rgb')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  formData.neonType === 'neon_rgb'
                    ? 'bg-slate-800 border-cyan-500 text-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Neón RGB
              </button>
              <button
                type="button"
                onClick={() => updateField('neonType', 'neon_doble_pista')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  formData.neonType === 'neon_doble_pista'
                    ? 'bg-slate-800 border-cyan-500 text-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Doble Pista
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Selección de material específico */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Material de neón registrado
                </label>
                {neonMaterials.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                    No hay materiales en la categoría "Neón LED Flex".
                  </div>
                ) : (
                  <select
                    value={formData.neonMaterialId}
                    onChange={(e) => updateField('neonMaterialId', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar material de neón...</option>
                    {neonMaterials.map((m) => (
                      <option key={m.id} value={m.id} disabled={!m.isActive}>
                        {m.name} {!m.isActive ? '(Inactivo)' : `(${formatARS(m.price)} / m)`}
                      </option>
                    ))}
                  </select>
                )}

                {result.neonDetail && (
                  <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-mono tabular-nums">
                    <span>Precio unitario:</span>
                    <span>{formatARS(result.neonDetail.unitPrice)} / metro</span>
                  </div>
                )}
              </div>

              {/* Metros lineales editables */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Metros lineales de recorrido <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.neonMeters}
                    onChange={(e) => handleNumericInput('neonMeters', e.target.value)}
                    placeholder="Ej: 4.5"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    metros
                  </span>
                </div>

                <div className="text-[11px] text-cyan-400 mt-1.5 flex justify-between font-mono tabular-nums font-semibold">
                  <span>Subtotal neón:</span>
                  <span>{formatARS(result.neonCost)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              <strong>Nota técnica:</strong> El consumo en metros lineales debe corresponder al recorrido real estimado del trazo y letras del diseño. Para neón de doble pista, ingresá la cantidad de metros que corresponda al consumo total utilizado (no se duplica automáticamente).
            </div>
          </div>

          {/* Bloque C: Base Acrílica */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>C. Base Acrílica</span>
              </h3>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.hasAcrylic}
                  onChange={(e) => updateField('hasAcrylic', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span className="text-xs text-slate-200 font-medium">Lleva acrílico</span>
              </label>
            </div>

            {formData.hasAcrylic ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tipo y espesor de acrílico registrado
                    </label>
                    {acrylicMaterials.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                        No hay materiales en la categoría "Acrílico".
                      </div>
                    ) : (
                      <select
                        value={formData.acrylicMaterialId}
                        onChange={(e) => updateField('acrylicMaterialId', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">Seleccionar acrílico...</option>
                        {acrylicMaterials.map((m) => (
                          <option key={m.id} value={m.id} disabled={!m.isActive}>
                            {m.name} {!m.isActive ? '(Inactivo)' : `(${formatARS(m.price)} / m²)`}
                          </option>
                        ))}
                      </select>
                    )}

                    {result.acrylicDetail && (
                      <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-mono tabular-nums">
                        <span>Precio unitario:</span>
                        <span>{formatARS(result.acrylicDetail.unitPrice)} / m²</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Superficie geométrica rectangular
                    </label>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-200 flex justify-between items-center tabular-nums">
                      <span>{result.acrylicAreaM2.toFixed(4)} m²</span>
                      <span className="text-slate-500 text-[11px]">
                        ({formData.widthCm}×{formData.heightCm} cm)
                      </span>
                    </div>

                    <div className="text-[11px] text-cyan-400 mt-1.5 flex justify-between font-mono tabular-nums font-semibold">
                      <span>Subtotal acrílico:</span>
                      <span>{formatARS(result.acrylicCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400">
                Cartel sin base acrílica (Costo de acrílico: $ 0,00).
              </div>
            )}
          </div>

          {/* Bloque D: Fuentes de Alimentación */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>D. Fuentes de Alimentación 12V</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seleccioná las fuentes requeridas según la potencia total de tu cartel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPowerSupply}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar fuente</span>
              </button>
            </div>

            {formData.powerSupplies.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-500 text-center">
                No se agregaron fuentes de alimentación a este presupuesto.
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.powerSupplies.map((item) => {
                  const selectedMat = materials.find((m) => m.id === item.materialId);
                  const sub = (selectedMat?.price || 0) * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <select
                          value={item.materialId}
                          onChange={(e) =>
                            handleUpdatePowerSupply(item.id, 'materialId', e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100"
                        >
                          <option value="">Seleccionar fuente...</option>
                          {powerMaterials.length > 0
                            ? powerMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({formatARS(m.price)})
                                </option>
                              ))
                            : materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({formatARS(m.price)})
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Cant:</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdatePowerSupply(
                                item.id,
                                'quantity',
                                Math.max(1, parseInt(e.target.value || '1', 10))
                              )
                            }
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-right text-slate-100 tabular-nums"
                          />
                        </div>

                        <div className="w-24 text-right font-mono text-xs text-slate-200 tabular-nums">
                          {formatARS(sub)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePowerSupply(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Quitar fuente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="text-right text-xs text-cyan-400 font-mono font-semibold tabular-nums pt-1">
                  Subtotal fuentes: {formatARS(result.powerSuppliesCost)}
                </div>
              </div>
            )}
          </div>

          {/* Bloque E: Insumos Detallados */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>E. Insumos Detallados</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cables, fichas de conexión, adhesivos y accesorios individuales del cartel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSupply}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar insumo</span>
              </button>
            </div>

            {formData.supplies.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-500 text-center">
                No se registraron insumos específicos en este trabajo.
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.supplies.map((item) => {
                  const selectedMat = materials.find((m) => m.id === item.materialId);
                  const sub = (selectedMat?.price || 0) * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <select
                          value={item.materialId}
                          onChange={(e) =>
                            handleUpdateSupply(item.id, 'materialId', e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100"
                        >
                          <option value="">Seleccionar insumo...</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({formatARS(m.price)} / {m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Cant:</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateSupply(
                                item.id,
                                'quantity',
                                Math.max(0.1, parseFloat(e.target.value || '1'))
                              )
                            }
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-right text-slate-100 tabular-nums"
                          />
                        </div>

                        <div className="w-24 text-right font-mono text-xs text-slate-200 tabular-nums">
                          {formatARS(sub)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSupply(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Quitar insumo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="text-right text-xs text-cyan-400 font-mono font-semibold tabular-nums pt-1">
                  Subtotal insumos: {formatARS(result.suppliesCost)}
                </div>
              </div>
            )}
          </div>

          {/* Bloque F: Mano de Obra, Estructura y Adicionales */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>F. Mano de Obra, Estructura y Adicionales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Porcentaje de Mano de Obra (% sobre materiales)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.laborPercentage}
                    onChange={(e) => handleNumericInput('laborPercentage', e.target.value)}
                    placeholder="0"
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    %
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono tabular-nums">
                  <span>Mano de obra (MO):</span>
                  <span className="text-slate-200 font-semibold">{formatARS(result.laborCost)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Estructura / Bastidor / Perfiles (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.structureCost}
                    onChange={(e) => handleNumericInput('structureCost', e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Insumos fijos generales del taller (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.fixedWorkshopCost}
                    onChange={(e) => handleNumericInput('fixedWorkshopCost', e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Costo de Envío y Embalaje (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shippingCost}
                    onChange={(e) => handleNumericInput('shippingCost', e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tabular-nums"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  No se multiplica por K (se agrega directo al final)
                </span>
              </div>
            </div>

            {/* Otros costos personalizados */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Otros Costos Adicionales
                </span>
                <button
                  type="button"
                  onClick={handleAddAdditionalCost}
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar otro costo</span>
                </button>
              </div>

              {formData.additionalCosts.length > 0 && (
                <div className="space-y-2">
                  {formData.additionalCosts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800"
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateAdditionalCost(item.id, 'description', e.target.value)
                        }
                        placeholder="Descripción (ej: Transformador especial, embalaje en madera)"
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={item.amount === 0 ? '' : item.amount}
                          onChange={(e) =>
                            handleUpdateAdditionalCost(
                              item.id,
                              'amount',
                              Math.max(0, parseFloat(e.target.value || '0'))
                            )
                          }
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-right text-slate-100 tabular-nums"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalCost(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bloque G: Multiplicador de Ganancia (K) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-400" />
                <span>G. Multiplicador de Ganancia (K)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multiplica el Costo Base (Materiales + Mano de Obra + Estructura + Insumos fijos).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[2.0, 2.5, 3.0].map((val) => {
                const isSelected = !isCustomMultiplier && formData.multiplier === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectMultiplier(val)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-sm font-mono tabular-nums">×{val.toString().replace('.', ',')}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {val === 2.0 ? 'Estándar' : val === 2.5 ? 'Recomendado' : 'Trabajo complejo'}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomMultiplier(true);
                  if (!customMultiplierInput) {
                    setCustomMultiplierInput(formData.multiplier.toString());
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                  isCustomMultiplier
                    ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="text-sm font-mono">Otro K</span>
                <span className="text-[10px] text-slate-400 font-normal">Personalizado</span>
              </button>
            </div>

            {isCustomMultiplier && (
              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 flex items-center gap-3">
                <span className="text-xs text-slate-300">Factor multiplicador K:</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-cyan-400 font-bold">
                    ×
                  </span>
                  <input
                    type="number"
                    min="1.0"
                    step="0.1"
                    value={customMultiplierInput}
                    onChange={handleCustomMultiplierChange}
                    placeholder="2.2"
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 tabular-nums focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary, Diagram & Actions */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Proportional Diagram Component */}
          <ProportionalDiagram
            widthCm={typeof formData.widthCm === 'number' ? formData.widthCm : 0}
            heightCm={typeof formData.heightCm === 'number' ? formData.heightCm : 0}
            hasAcrylic={formData.hasAcrylic}
            neonType={formData.neonType}
            neonMeters={typeof formData.neonMeters === 'number' ? formData.neonMeters : 0}
          />

          {/* Detailed Calculation Summary Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Desglose de Costos
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  K = ×{result.multiplier.toString().replace('.', ',')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Presupuesto del Cartel
              </h3>
            </div>

            {/* Line items table */}
            <div className="space-y-2 text-xs text-slate-300 divide-y divide-slate-800/80 pt-1">
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Neón LED Flex:</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {formatARS(result.neonCost)}
                  </span>
                </div>
                {formData.hasAcrylic && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Base Acrílica:</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.acrylicCost)}
                    </span>
                  </div>
                )}
                {result.powerSuppliesCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Fuentes de Alimentación:</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.powerSuppliesCost)}
                    </span>
                  </div>
                )}
                {result.suppliesCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Insumos Detallados:</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.suppliesCost)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center font-medium text-slate-100 pt-1 border-t border-slate-800/40">
                  <span>Subtotal Materiales (M):</span>
                  <span className="font-mono tabular-nums text-cyan-400">
                    {formatARS(result.materialsSubtotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Mano de Obra ({result.laborPercentage}%):
                  </span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {formatARS(result.laborCost)}
                  </span>
                </div>

                {result.structureCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Estructura / Bastidor (E):</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.structureCost)}
                    </span>
                  </div>
                )}

                {result.otherCostsTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Insumos fijos y otros (I):</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.otherCostsTotal)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center font-semibold text-slate-100 pt-1 border-t border-slate-800/40">
                  <span>Costo Base Total (M + MO + E + I):</span>
                  <span className="font-mono tabular-nums text-slate-100">
                    {formatARS(result.baseCost)}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Venta antes de envío (Base × {result.multiplier}):
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-100">
                    {formatARS(result.sellingPriceBeforeShipping)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-emerald-400">
                  <span>Margen monetario sobre costos:</span>
                  <span className="font-mono tabular-nums font-semibold">
                    +{formatARS(result.monetaryMargin)}
                  </span>
                </div>

                {result.shippingCost > 0 && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Envío y embalaje (sin multiplicar):</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatARS(result.shippingCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total final al cliente */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Precio Final Sugerido al Cliente
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
                {formatARS(result.finalPrice)}
              </div>

              {/* Seña y Saldo breakdown */}
              {(() => {
                const depPct =
                  typeof businessProfile.depositPercentage === 'number'
                    ? businessProfile.depositPercentage
                    : 50;
                const depAmt = Math.round(result.finalPrice * (depPct / 100));
                const balAmt = Math.max(0, result.finalPrice - depAmt);

                return (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
                      <span className="text-[10px] text-cyan-400 font-semibold block">
                        Seña inicial ({depPct}%)
                      </span>
                      <span className="text-xs font-bold font-mono text-white tabular-nums">
                        {formatARS(depAmt)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Saldo restante
                      </span>
                      <span className="text-xs font-bold font-mono text-white tabular-nums">
                        {formatARS(balAmt)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <span className="text-[10px] text-slate-500 block">
                Incluye materiales, confección, estructura y envío en pesos argentinos (ARS).
              </span>
            </div>

            {/* Action Buttons in Summary Card */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Guardando presupuesto...'
                    : editingQuote
                    ? 'Actualizar Presupuesto'
                    : 'Guardar Presupuesto'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                <FileDown className="w-4 h-4 text-cyan-400" />
                <span>Guardar y Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
