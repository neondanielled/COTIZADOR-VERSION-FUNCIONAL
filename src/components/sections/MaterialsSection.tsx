import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  FolderPlus,
  FolderMinus,
} from 'lucide-react';
import {
  Material,
  MaterialFormData,
  StandardUnitOfMeasure,
  STANDARD_UNITS,
} from '../../types/material';
import { formatARS } from '../../utils/currency';
import { getUnitLabel, getUnitAbbreviation } from '../../utils/units';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface MaterialsSectionProps {
  materials: Material[];
  categories: string[];
  onCreateMaterial: (data: MaterialFormData) => Promise<void>;
  onUpdateMaterial: (id: string, updates: Partial<MaterialFormData>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onAddCategory: (category: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
  isLoading?: boolean;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  materials,
  categories,
  onCreateMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddCategory,
  onDeleteCategory,
  isLoading = false,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Delete dialog state
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Form state
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    category: categories[0] || 'Neón LED Flex',
    description: '',
    price: 0,
    unit: 'metro_lineal',
    customUnitName: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesDesc = item.description?.toLowerCase().includes(term) || false;
        const matchesCat = item.category.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      return true;
    });
  }, [materials, searchTerm, selectedCategory, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = (presetCategory?: string) => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      category: presetCategory || (selectedCategory !== 'all' ? selectedCategory : (categories[0] || 'Neón LED Flex')),
      description: '',
      price: 0,
      unit: 'metro_lineal',
      customUnitName: '',
      isActive: true,
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category,
      description: material.description || '',
      price: material.price,
      unit: material.unit,
      customUnitName: material.customUnitName || '',
      isActive: material.isActive,
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre del material es obligatorio.';
    }
    if (!formData.category.trim()) {
      errors.category = 'La categoría es obligatoria.';
    }
    if (typeof formData.price !== 'number' || isNaN(formData.price)) {
      errors.price = 'Debe indicar un precio numérico válido.';
    } else if (formData.price < 0) {
      errors.price = 'El precio no puede ser negativo.';
    }
    if (formData.unit === 'personalizada' && (!formData.customUnitName || !formData.customUnitName.trim())) {
      errors.customUnitName = 'Indique el nombre de la unidad personalizada.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        await onUpdateMaterial(editingMaterial.id, formData);
      } else {
        await onCreateMaterial(formData);
      }
      setIsEditorModalOpen(false);
      setEditingMaterial(null);
    } catch (err: unknown) {
      console.error(err);
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Error al guardar el material.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      await onDeleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Add Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('El nombre de la categoría es obligatorio.');
      return;
    }
    try {
      await onAddCategory(trimmed);
      setNewCategoryName('');
      setCategoryError('');
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'Error al crear la categoría.');
    }
  };

  // Delete Category
  const handleDeleteCategoryItem = async (category: string) => {
    try {
      await onDeleteCategory(category);
      if (selectedCategory === category) {
        setSelectedCategory('all');
      }
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'No se puede eliminar la categoría.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            <span>Materiales e Insumos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Catálogo del taller: neón LED, planchas de acrílico, fuentes de alimentación e insumos.
            Precios unitarios en pesos argentinos (ARS).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCategoryError('');
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Gestionar categorías</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Material</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, categoría o descripción..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-slate-800 text-slate-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        {/* Categories Segmented Control (Interactive Filter Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            Todas las categorías ({materials.length})
          </button>

          {categories.map((cat) => {
            const count = materials.filter((m) => m.category === cat).length;
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

      {/* Materials Table or Empty States */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {materials.length === 0 ? (
          /* Empty state: No materials at all */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Catálogo de Materiales Vacío
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Aún no registraste ningún material en tu taller. Registrá tus tiras LED Neón Flex,
              planchas de acrílico de 3mm y 4mm, fuentes y cables con sus precios reales en ARS.
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear primer material</span>
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          /* Empty state: No search / filter matches */
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm text-slate-300 font-medium">
              No se encontraron materiales con los filtros aplicados.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Probá modificando el término de búsqueda o seleccionando otra categoría.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          /* Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Material / Insumo</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Unidad</th>
                  <th className="px-4 py-3 font-semibold text-right">Precio Unitario (ARS)</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMaterials.map((material) => (
                  <tr
                    key={material.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Name & Description */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-100 text-sm">
                        {material.name}
                      </div>
                      {material.description && (
                        <div className="text-slate-400 text-[11px] mt-0.5 max-w-sm truncate">
                          {material.description}
                        </div>
                      )}
                    </td>

                    {/* Category (Clean Unboxed Text with dot separator if desired) */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {material.category}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3.5 text-slate-400">
                      <span>{getUnitLabel(material.unit, material.customUnitName)}</span>
                      <span className="text-slate-500 text-[10px] ml-1">
                        ({getUnitAbbreviation(material.unit, material.customUnitName)})
                      </span>
                    </td>

                    {/* Price in ARS */}
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-slate-100 tabular-nums">
                      {formatARS(material.price)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          material.isActive ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {material.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(material)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar material"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaterialToDelete(material)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Mostrando {filteredMaterials.length} de {materials.length} materiales registrados
          </span>
          <span className="text-[11px] text-slate-500">
            Valores de costo base listos para vincular al motor en Fase 2
          </span>
        </div>
      </div>

      {/* Modal: Crear / Editar Material */}
      <Modal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingMaterial(null);
        }}
        title={editingMaterial ? 'Editar Material' : 'Nuevo Material'}
        subtitle={
          editingMaterial
            ? 'Actualizá las características y el precio unitario del ítem'
            : 'Completá los datos del material para integrarlo al taller'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {formErrors.submit}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del material <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Neón LED 6x12mm Amarillo Cálido 12V"
              className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                formErrors.name
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
              }`}
            />
            {formErrors.name && (
              <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoría <span className="text-cyan-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-[11px] text-rose-400 mt-1">{formErrors.category}</p>
              )}
            </div>

            {/* Unit of measure */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unidad de medida <span className="text-cyan-400">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit: e.target.value as StandardUnitOfMeasure,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom unit name field if unit === 'personalizada' */}
          {formData.unit === 'personalizada' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre de la unidad personalizada <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={formData.customUnitName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customUnitName: e.target.value })
                }
                placeholder="Ej: Rollo de 50m, Pack x10"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              {formErrors.customUnitName && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {formErrors.customUnitName}
                </p>
              )}
            </div>
          )}

          {/* Price & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Precio unitario en ARS <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setFormData({ ...formData, price: isNaN(val) ? 0 : val });
                  }}
                  placeholder="0,00"
                  className={`w-full pl-8 pr-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                    formErrors.price
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
              </div>
              {formErrors.price && (
                <p className="text-[11px] text-rose-400 mt-1">{formErrors.price}</p>
              )}
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Material activo para cotizaciones
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción o notas (opcional)
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles técnicos, proveedor de referencia o medidas específicas..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditorModalOpen(false);
                setEditingMaterial(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
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
                : editingMaterial
                ? 'Guardar Modificaciones'
                : 'Crear Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Administrador de Categorías */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryError('');
        }}
        title="Gestión de Categorías"
        subtitle="Agregá o eliminá categorías para clasificar los materiales del taller"
        maxWidth="md"
      >
        <div className="space-y-5">
          {categoryError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {categoryError}
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setCategoryError('');
              }}
              placeholder="Nueva categoría (ej: Transformadores 24V)"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </form>

          {/* List of existing categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Categorías actuales ({categories.length})
            </h4>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950/60 max-h-60 overflow-y-auto">
              {categories.map((cat) => {
                const count = materials.filter((m) => m.category === cat).length;
                const canDelete = count === 0;

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-3 py-2.5 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cat}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({count} {count === 1 ? 'ítem' : 'ítems'})
                      </span>
                    </div>

                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryItem(cat)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors"
                        title="Eliminar categoría vacía"
                      >
                        <FolderMinus className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="text-[10px] text-slate-400"
                        title="No puede eliminarse mientras tenga materiales asignados"
                      >
                        En uso
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setCategoryError('');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Dialog: Confirmar Eliminación de Material */}
      <ConfirmDialog
        isOpen={materialToDelete !== null}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Material"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${materialToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar material"
        cancelLabel="Conservar material"
        isDestructive={true}
      />
    </div>
  );
};
