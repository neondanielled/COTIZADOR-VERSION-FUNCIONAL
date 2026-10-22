import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  Globe,
  Edit2,
  Trash2,
  MessageCircle,
  Tag,
} from 'lucide-react';
import { Supplier, SupplierFormData } from '../../types/supplier';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SuppliersSectionProps {
  suppliers: Supplier[];
  categories: string[];
  onCreateSupplier: (data: SupplierFormData) => Promise<void>;
  onUpdateSupplier: (id: string, updates: Partial<SupplierFormData>) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const SuppliersSection: React.FC<SuppliersSectionProps> = ({
  suppliers,
  categories,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState<SupplierFormData>({
    tradeName: '',
    contactPerson: '',
    whatsapp: '',
    email: '',
    website: '',
    suppliedCategories: [],
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = s.tradeName.toLowerCase().includes(term);
        const matchContact = s.contactPerson?.toLowerCase().includes(term) || false;
        const matchPhone = s.whatsapp.toLowerCase().includes(term);
        if (!matchName && !matchContact && !matchPhone) return false;
      }

      if (selectedCategory !== 'all') {
        if (!s.suppliedCategories.includes(selectedCategory)) return false;
      }

      return true;
    });
  }, [suppliers, searchTerm, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      tradeName: '',
      contactPerson: '',
      whatsapp: '',
      email: '',
      website: '',
      suppliedCategories: [],
      notes: '',
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      tradeName: supplier.tradeName,
      contactPerson: supplier.contactPerson || '',
      whatsapp: supplier.whatsapp,
      email: supplier.email || '',
      website: supplier.website || '',
      suppliedCategories: supplier.suppliedCategories || [],
      notes: supplier.notes || '',
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleToggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.suppliedCategories.includes(cat);
      const updated = exists
        ? prev.suppliedCategories.filter((c) => c !== cat)
        : [...prev.suppliedCategories, cat];
      return { ...prev, suppliedCategories: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.tradeName.trim()) {
      errors.tradeName = 'El nombre comercial del proveedor es obligatorio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await onUpdateSupplier(editingSupplier.id, formData);
      } else {
        await onCreateSupplier(formData);
      }
      setIsEditorModalOpen(false);
      setEditingSupplier(null);
    } catch (err: unknown) {
      console.error(err);
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Error al guardar el proveedor.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await onDeleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola ${name}, te contactamos desde nuestro taller de carteles.`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>Directorio de Proveedores</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Agenda de proveedores de tiras neón, acrílicos, fuentes 12V e insumos del taller.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razón social, contacto o teléfono..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            Todos los rubros ({suppliers.length})
          </button>
          {categories.map((cat) => {
            const count = suppliers.filter((s) => s.suppliedCategories.includes(cat)).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{cat}</span>
                <span className="font-mono text-[11px] opacity-70 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {suppliers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Directorio de Proveedores Vacío
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Registrá a tus importadores de tiras neón, mayoristas de acrílico y distribuidores de transformadores.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar primer proveedor</span>
            </button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm text-slate-300 font-medium">
              No se encontraron proveedores para los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
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
                  <th className="px-5 py-3 font-semibold">Proveedor / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">Rubros / Materiales</th>
                  <th className="px-4 py-3 font-semibold">Contacto / WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">Web / Redes</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSuppliers.map((supplier) => {
                  const hasPhone = Boolean(supplier.whatsapp && supplier.whatsapp.trim());

                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Contact Person */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100 text-sm">
                          {supplier.tradeName}
                        </div>
                        {supplier.contactPerson && (
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Contacto: {supplier.contactPerson}
                          </div>
                        )}
                        {supplier.notes && (
                          <div className="text-slate-500 text-[11px] mt-0.5 truncate max-w-xs">
                            {supplier.notes}
                          </div>
                        )}
                      </td>

                      {/* Supplied categories */}
                      <td className="px-4 py-3.5">
                        {supplier.suppliedCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                            {supplier.suppliedCategories.join(' · ')}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Varios insumos</span>
                        )}
                      </td>

                      {/* WhatsApp / Phone */}
                      <td className="px-4 py-3.5">
                        {hasPhone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-200 tabular-nums">
                              {supplier.whatsapp}
                            </span>
                            <a
                              href={getWhatsAppLink(supplier.whatsapp, supplier.tradeName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md transition-colors"
                              title="Abrir chat de WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-500">Sin teléfono</span>
                        )}
                        {supplier.email && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Website */}
                      <td className="px-4 py-3.5 text-slate-300">
                        {supplier.website ? (
                          <a
                            href={
                              supplier.website.startsWith('http')
                                ? supplier.website
                                : `https://${supplier.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[140px]">{supplier.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">No especificado</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(supplier)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar proveedor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(supplier)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar proveedor"
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
          <span>{filteredSuppliers.length} proveedores registrados</span>
          <span className="text-[11px] text-slate-500">
            Eliminar un proveedor no altera el catálogo de materiales ni cotizaciones
          </span>
        </div>
      </div>

      {/* Modal: Crear / Editar Proveedor */}
      <Modal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle="Registrá los datos comerciales del distribuidor o importador"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre comercial / Razón social <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Ej: Distribuidora Neón Argentina"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  formErrors.tradeName
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
              />
              {formErrors.tradeName && (
                <p className="text-[11px] text-rose-400 mt-1">{formErrors.tradeName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Persona de contacto / Vendedor (opcional)
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Ej: Martín Rodríguez"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+54 9 11 5555-8888"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo electrónico (opcional)
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ventas@proveedorneon.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sitio web o Instagram (opcional)
            </label>
            <input
              type="text"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.proveedor.com.ar o @proveedor"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Rubros suministrados
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              {categories.map((cat) => {
                const checked = formData.suppliedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      checked
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Condiciones de despacho, monto mínimo de compra, plazos de entrega..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditorModalOpen(false);
                setEditingSupplier(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : editingSupplier
                ? 'Guardar Cambios'
                : 'Registrar Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Supplier */}
      <ConfirmDialog
        isOpen={supplierToDelete !== null}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar al proveedor "${supplierToDelete?.tradeName}"? Los materiales del taller permanecerán sin cambios.`}
        confirmLabel="Eliminar proveedor"
        cancelLabel="Conservar proveedor"
        isDestructive={true}
      />
    </div>
  );
};
