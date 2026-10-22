import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { Client, ClientFormData } from '../../types/client';
import { SavedQuote } from '../../types/quote';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ClientsSectionProps {
  clients: Client[];
  quotes: SavedQuote[];
  onCreateClient: (data: ClientFormData) => Promise<void>;
  onUpdateClient: (id: string, updates: Partial<ClientFormData>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onOpenQuoteDetails?: (quote: SavedQuote) => void;
  isLoading?: boolean;
}

export const ClientsSection: React.FC<ClientsSectionProps> = ({
  clients,
  quotes,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase().trim();
    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(term);
      const matchPhone = c.whatsapp.toLowerCase().includes(term);
      const matchCity = c.city?.toLowerCase().includes(term) || false;
      return matchName || matchPhone || matchCity;
    });
  }, [clients, searchTerm]);

  // Map client ID to count of linked quotes
  const quotesCountByClient = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of quotes) {
      if (q.clientId) {
        map[q.clientId] = (map[q.clientId] || 0) + 1;
      }
    }
    return map;
  }, [quotes]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      whatsapp: '',
      email: '',
      city: '',
      address: '',
      notes: '',
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      whatsapp: client.whatsapp,
      email: client.email || '',
      city: client.city || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre o razón social es obligatorio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, formData);
      } else {
        await onCreateClient(formData);
      }
      setIsEditorModalOpen(false);
      setEditingClient(null);
    } catch (err: unknown) {
      console.error(err);
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Error al guardar el cliente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to build WhatsApp link
  const getWhatsAppLink = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola ${clientName}, te escribimos de nuestro taller de cartelería LED Neón.`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Directorio de Clientes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestión comercial de contactos del taller. Vinculá tus presupuestos y abrí WhatsApp en un clic.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono o ciudad..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Clients List or Empty State */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {clients.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Directorio de Clientes Vacío
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Aún no agregaste clientes a tu taller. Guardá a tus clientes frecuentes para seleccionarlos automáticamente en el Cotizador.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear primer cliente</span>
            </button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm text-slate-300 font-medium">
              No se encontraron clientes con el criterio "{searchTerm}".
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp / Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Ubicación</th>
                  <th className="px-4 py-3 font-semibold text-center">Presupuestos</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClients.map((client) => {
                  const linkedQuotesCount = quotesCountByClient[client.id] || 0;
                  const hasPhone = Boolean(client.whatsapp && client.whatsapp.trim());

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Notes */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100 text-sm">
                          {client.name}
                        </div>
                        {client.notes && (
                          <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-xs">
                            {client.notes}
                          </div>
                        )}
                        {client.email && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Phone & WhatsApp Button */}
                      <td className="px-4 py-3.5">
                        {hasPhone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-200 tabular-nums">
                              {client.whatsapp}
                            </span>
                            <a
                              href={getWhatsAppLink(client.whatsapp, client.name)}
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
                          <span className="text-slate-500 text-xs">Sin teléfono</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 text-slate-300">
                        {client.city || client.address ? (
                          <div className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{[client.city, client.address].filter(Boolean).join(', ')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">No especificada</span>
                        )}
                      </td>

                      {/* Linked Quotes Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 tabular-nums">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{linkedQuotesCount}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(client)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar cliente"
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
          <span>{filteredClients.length} clientes en el taller</span>
          <span className="text-[11px] text-slate-500">
            Eliminar un cliente conserva intactos sus presupuestos históricos asociados
          </span>
        </div>
      </div>

      {/* Modal: Crear / Editar Cliente */}
      <Modal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingClient(null);
        }}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        subtitle="Registrá los datos de contacto y facturación del cliente"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {formErrors.submit}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre completo o Razón Social <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Sofía Gómez / Bar Palermo"
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
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+54 9 11 5555-1234"
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
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ciudad / Localidad (opcional)
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Buenos Aires"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dirección de entrega (opcional)
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Av. Santa Fe 1234"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
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
              placeholder="Preferencias de color, horarios de entrega o comentarios del cliente..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditorModalOpen(false);
                setEditingClient(null);
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
                : editingClient
                ? 'Guardar Cambios'
                : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Client */}
      <ConfirmDialog
        isOpen={clientToDelete !== null}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${clientToDelete?.name}"? Sus presupuestos históricos permanecerán intactos.`}
        confirmLabel="Eliminar cliente"
        cancelLabel="Conservar cliente"
        isDestructive={true}
      />
    </div>
  );
};
