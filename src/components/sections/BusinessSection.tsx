import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Percent,
  RefreshCw,
  Info,
} from 'lucide-react';
import { BusinessProfile, PaymentMethodItem } from '../../types/business';
import { Modal } from '../common/Modal';
import { processAndCompressImage } from '../../services/imageStorage';

interface BusinessSectionProps {
  initialProfile: BusinessProfile;
  onSave: (profile: Partial<BusinessProfile>) => Promise<void>;
  isLoading?: boolean;
}

export const BusinessSection: React.FC<BusinessSectionProps> = ({
  initialProfile,
  onSave,
  isLoading = false,
}) => {
  // Local form state
  const [formData, setFormData] = useState<BusinessProfile>(initialProfile);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Logo upload state
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom payment method modal
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [customPaymentName, setCustomPaymentName] = useState('');
  const [customPaymentDetails, setCustomPaymentDetails] = useState('');
  const [customPaymentError, setCustomPaymentError] = useState('');

  // Sync state whenever initialProfile changes
  useEffect(() => {
    setFormData(initialProfile);
    setHasChanges(false);
    setErrors({});
    setImageError('');
  }, [initialProfile]);

  const handleChange = <K extends keyof BusinessProfile>(
    field: K,
    value: BusinessProfile[K]
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      setHasChanges(true);
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Image Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsProcessingImage(true);

    try {
      const { dataUrl } = await processAndCompressImage(file, 800);
      handleChange('logoDataUrl', dataUrl);
    } catch (err) {
      console.error(err);
      setImageError(err instanceof Error ? err.message : 'Error al procesar la imagen seleccionada.');
    } finally {
      setIsProcessingImage(false);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    handleChange('logoDataUrl', '');
    setImageError('');
  };

  const handleTogglePaymentMethod = (id: string) => {
    const updated = formData.paymentMethods.map((pm) =>
      pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
    );
    handleChange('paymentMethods', updated);
  };

  const handleRemoveCustomPaymentMethod = (id: string) => {
    const updated = formData.paymentMethods.filter((pm) => pm.id !== id);
    handleChange('paymentMethods', updated);
  };

  const handleAddCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customPaymentName.trim();
    if (!trimmed) {
      setCustomPaymentError('El nombre del método de pago es obligatorio.');
      return;
    }

    const exists = formData.paymentMethods.some(
      (pm) => pm.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setCustomPaymentError('Ya existe una forma de pago con este nombre.');
      return;
    }

    const newItem: PaymentMethodItem = {
      id: `custom_pm_${Date.now()}`,
      name: trimmed,
      enabled: true,
      isCustom: true,
      details: customPaymentDetails.trim() || undefined,
    };

    handleChange('paymentMethods', [...formData.paymentMethods, newItem]);
    setIsAddPaymentModalOpen(false);
    setCustomPaymentName('');
    setCustomPaymentDetails('');
    setCustomPaymentError('');
  };

  const handleCancelChanges = () => {
    setFormData(initialProfile);
    setHasChanges(false);
    setErrors({});
    setImageError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.tradeName.trim()) {
      newErrors.tradeName = 'El nombre comercial de tu taller es recomendado.';
    }

    // Validate deposit percentage
    const deposit = Number(formData.depositPercentage);
    if (isNaN(deposit) || deposit < 0 || deposit > 100) {
      newErrors.depositPercentage = 'El porcentaje de seña debe estar entre 0% y 100%.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      setHasChanges(false);
      setErrors({});
    } catch (err: unknown) {
      console.error(err);
      setErrors({
        submit: err instanceof Error ? err.message : 'Error al guardar los datos del negocio.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Mi Negocio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configuración comercial del taller. Estos datos se utilizarán en los encabezados,
            condiciones de venta, cálculo de seña y presupuestos en PDF.
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Descartar cambios</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        )}
      </div>

      {errors.submit && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 0: Logo o Imagen del Negocio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Logo o Imagen del Negocio</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta imagen se incluirá en la cabecera de los presupuestos PDF y en la identidad visual de tu taller.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">JPG, PNG o WebP · Máx. 5 MB</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {imageError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          {formData.logoDataUrl ? (
            /* Real Logo Preview */
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
                <img
                  src={formData.logoDataUrl}
                  alt="Logo del negocio"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-semibold text-white">Logo cargado correctamente</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Las proporciones originales se conservan con nitidez para impresión vectorial y exportación de presupuestos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessingImage ? 'animate-spin' : ''}`} />
                    <span>{isProcessingImage ? 'Procesando...' : 'Cambiar imagen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isProcessingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar logo</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone (No fake image) */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 mb-3 transition-colors">
                {isProcessingImage ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                {isProcessingImage ? 'Optimizando imagen...' : 'Hacé clic para subir el logo de tu taller'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Formatos compatibles: JPG, JPEG, PNG y WebP. Tamaño máximo de hasta 5 MB.
              </p>
            </div>
          )}
        </div>

        {/* Card 1: Identificación del Taller */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Identificación Comercial
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre comercial del taller <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => handleChange('tradeName', e.target.value)}
                placeholder="Ej: Neón Studio Buenos Aires"
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  errors.tradeName
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
              />
              {errors.tradeName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.tradeName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre del responsable
              </label>
              <input
                type="text"
                value={formData.responsibleName}
                onChange={(e) => handleChange('responsibleName', e.target.value)}
                placeholder="Ej: Daniel Rodríguez"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Canales de Contacto y Ubicación */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Contacto y Ubicación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Número de WhatsApp (con código de área)
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="Ej: +54 9 11 5555-4321"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Instagram del taller
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-500 pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  value={formData.instagram.replace(/^@/, '')}
                  onChange={(e) => handleChange('instagram', `@${e.target.value.replace(/^@/, '')}`)}
                  placeholder="tallerneon.ar"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ciudad / Localidad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Córdoba Capital, Córdoba"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dirección del taller
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ej: Av. San Martín 1234, Galpón 4"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Página web (opcional)
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.mineontaller.com.ar"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Formas de Pago Aceptadas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Formas de Pago Aceptadas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccioná los medios de pago que recibe tu taller o agregá personalizados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar forma de pago</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {formData.paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  pm.enabled
                    ? 'bg-slate-950 border-cyan-500/30 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer select-none flex-1 truncate">
                  <input
                    type="checkbox"
                    checked={pm.enabled}
                    onChange={() => handleTogglePaymentMethod(pm.id)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-900"
                  />
                  <div className="truncate">
                    <span className="text-xs sm:text-sm font-medium truncate block">
                      {pm.name}
                    </span>
                    {pm.details && (
                      <span className="text-[11px] text-slate-400 truncate block">
                        {pm.details}
                      </span>
                    )}
                  </div>
                </label>

                {pm.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomPaymentMethod(pm.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors ml-2"
                    title="Eliminar forma de pago personalizada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Política de Seña y Condiciones Comerciales */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span>Seña Comercial y Condiciones de Venta</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurá el porcentaje de anticipo requerido para iniciar la producción y los términos del taller.
            </p>
          </div>

          {/* Deposit Percentage Input */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-white">
                  Porcentaje de seña para iniciar fabricación (%)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Se calculará automáticamente el monto de la seña y el saldo restante en los presupuestos y en el PDF.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-28">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.depositPercentage}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleChange('depositPercentage', isNaN(val) ? 0 : val);
                    }}
                    className={`w-full pr-8 pl-3.5 py-2 bg-slate-900 border rounded-xl text-sm font-mono font-bold text-cyan-400 text-right focus:outline-none focus:ring-1 ${
                      errors.depositPercentage
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                    }`}
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                    %
                  </span>
                </div>

                <div className="flex gap-1">
                  {[30, 50, 70].map((quickPct) => (
                    <button
                      key={quickPct}
                      type="button"
                      onClick={() => handleChange('depositPercentage', quickPct)}
                      className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
                        formData.depositPercentage === quickPct
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {quickPct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errors.depositPercentage && (
              <p className="text-[11px] text-rose-400">{errors.depositPercentage}</p>
            )}

            <div className="text-[11px] text-cyan-400/90 bg-cyan-950/30 border border-cyan-800/30 rounded-lg p-2.5 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                Ejemplo: para un presupuesto total de $ 100.000,00 con <strong>{formData.depositPercentage}%</strong>, el PDF mostrará{' '}
                <strong>Seña para inicio de fabricación: ${(100000 * (formData.depositPercentage / 100)).toLocaleString('es-AR')}</strong> y{' '}
                <strong>Saldo pendiente contra entrega: ${(100000 * (1 - formData.depositPercentage / 100)).toLocaleString('es-AR')}</strong>.
              </span>
            </div>
          </div>

          {/* Terms & Conditions Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Términos y condiciones detallados
              </label>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Se imprime al pie del presupuesto</span>
              </span>
            </div>
            <textarea
              rows={4}
              value={formData.commercialConditions}
              onChange={(e) => handleChange('commercialConditions', e.target.value)}
              placeholder="Ej: Validez del presupuesto: 10 días. Seña 50% al confirmar y saldo contra entrega. Tiempo de fabricación: 7 días hábiles..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Detallá validez de cotización, seña, garantía sobre fuentes y tiras neón, y plazos de entrega.
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={isSaving || isLoading}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar cambios
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-lg shadow-cyan-500/10 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Guardando en almacenamiento...' : 'Guardar Información del Negocio'}</span>
          </button>
        </div>
      </form>

      {/* Modal: Agregar forma de pago personalizada */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setCustomPaymentError('');
        }}
        title="Agregar Forma de Pago"
        subtitle="Agregá un medio de pago personalizado para tu taller"
        maxWidth="md"
      >
        <form onSubmit={handleAddCustomPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre de la forma de pago <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={customPaymentName}
              onChange={(e) => {
                setCustomPaymentName(e.target.value);
                setCustomPaymentError('');
              }}
              placeholder="Ej: Criptomonedas (USDT), Cheque al día"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {customPaymentError && (
              <p className="text-[11px] text-rose-400 mt-1">{customPaymentError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Detalles o aclaraciones (opcional)
            </label>
            <input
              type="text"
              value={customPaymentDetails}
              onChange={(e) => setCustomPaymentDetails(e.target.value)}
              placeholder="Ej: Red TRC20 o acreditación previa"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddPaymentModalOpen(false);
                setCustomPaymentError('');
              }}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors"
            >
              Agregar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
