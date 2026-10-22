/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationSection } from './types/navigation';
import { BusinessProfile, INITIAL_BUSINESS_PROFILE } from './types/business';
import { Material, MaterialFormData } from './types/material';
import {
  SavedQuote,
  QuoteStatus,
  QuoteFormData,
  QuoteCalculationResult,
  SavedQuoteMaterialSnapshot,
} from './types/quote';
import { Client, ClientFormData } from './types/client';
import { Supplier, SupplierFormData } from './types/supplier';
import {
  businessRepository,
  materialRepository,
  quoteRepository,
  clientRepository,
  supplierRepository,
} from './repositories';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { DashboardSection } from './components/sections/DashboardSection';
import { BusinessSection } from './components/sections/BusinessSection';
import { MaterialsSection } from './components/sections/MaterialsSection';
import { QuoteBuilderSection } from './components/sections/QuoteBuilderSection';
import { QuotesSection } from './components/sections/QuotesSection';
import { ClientsSection } from './components/sections/ClientsSection';
import { SuppliersSection } from './components/sections/SuppliersSection';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavigationSection>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Application Data State
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingQuote, setEditingQuote] = useState<SavedQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial Load from decoupled repository layer
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [
          profileData,
          materialsData,
          categoriesData,
          quotesData,
          clientsData,
          suppliersData,
        ] = await Promise.all([
          businessRepository.getProfile(),
          materialRepository.getAll(),
          materialRepository.getCategories(),
          quoteRepository.getAll(),
          clientRepository.getAll(),
          supplierRepository.getAll(),
        ]);

        if (isMounted) {
          setBusinessProfile(profileData);
          setMaterials(materialsData);
          setCategories(categoriesData);
          setQuotes(quotesData);
          setClients(clientsData);
          setSuppliers(suppliersData);
        }
      } catch (error) {
        console.error('Error al inicializar la base de datos local:', error);
        if (isMounted) {
          addToast('error', 'Error al cargar datos', 'No se pudieron recuperar todos los datos locales.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [addToast]);

  // Business Profile Actions
  const handleSaveBusinessProfile = async (updates: Partial<BusinessProfile>) => {
    try {
      const saved = await businessRepository.saveProfile(updates);
      setBusinessProfile(saved);
      addToast(
        'success',
        'Datos del negocio guardados',
        'La información comercial de tu taller fue actualizada exitosamente.'
      );
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'Error al guardar',
        error instanceof Error ? error.message : 'No se pudo guardar la información comercial.'
      );
      throw error;
    }
  };

  // Materials Actions
  const handleCreateMaterial = async (data: MaterialFormData) => {
    try {
      const created = await materialRepository.create(data);
      setMaterials((prev) => [created, ...prev]);
      addToast(
        'success',
        'Material creado exitosamente',
        `"${created.name}" fue agregado al catálogo con precio ${created.price > 0 ? 'actualizado' : 'inicial'}.`
      );
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'Error al crear material',
        error instanceof Error ? error.message : 'No se pudo registrar el nuevo material.'
      );
      throw error;
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<MaterialFormData>) => {
    try {
      const updated = await materialRepository.update(id, updates);
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'success',
        'Material modificado',
        `Los cambios en "${updated.name}" se guardaron correctamente.`
      );
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'Error al modificar material',
        error instanceof Error ? error.message : 'No se pudieron guardar las modificaciones.'
      );
      throw error;
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const item = materials.find((m) => m.id === id);
    try {
      await materialRepository.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      addToast(
        'success',
        'Material eliminado',
        item ? `"${item.name}" fue removido del catálogo.` : 'El material fue eliminado.'
      );
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'Error al eliminar material',
        error instanceof Error ? error.message : 'No se pudo eliminar el material del catálogo.'
      );
      throw error;
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      const updated = await materialRepository.addCategory(categoryName);
      setCategories(updated);
      addToast('success', 'Categoría creada', `La categoría "${categoryName}" está disponible.`);
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'Error al agregar categoría',
        error instanceof Error ? error.message : 'No se pudo crear la nueva categoría.'
      );
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    try {
      const updated = await materialRepository.deleteCategory(categoryName);
      setCategories(updated);
      addToast('success', 'Categoría eliminada', `La categoría "${categoryName}" fue removida.`);
    } catch (error) {
      console.error(error);
      addToast(
        'error',
        'No se puede eliminar la categoría',
        error instanceof Error ? error.message : 'Verifique que no contenga materiales asociados.'
      );
      throw error;
    }
  };

  // Quote Actions
  const handleSaveQuote = async (
    formData: QuoteFormData,
    calculationResult: QuoteCalculationResult,
    existingQuoteId?: string
  ): Promise<SavedQuote> => {
    // 1. Snapshot materials used
    const neonMat = materials.find((m) => m.id === formData.neonMaterialId);
    const acrylicMat =
      formData.hasAcrylic && formData.acrylicMaterialId
        ? materials.find((m) => m.id === formData.acrylicMaterialId)
        : undefined;

    const materialsSnapshot: SavedQuoteMaterialSnapshot[] = [];
    if (neonMat) {
      materialsSnapshot.push({
        materialId: neonMat.id,
        name: neonMat.name,
        category: neonMat.category,
        unit: neonMat.unit,
        unitPrice: neonMat.price,
      });
    }
    if (acrylicMat) {
      materialsSnapshot.push({
        materialId: acrylicMat.id,
        name: acrylicMat.name,
        category: acrylicMat.category,
        unit: acrylicMat.unit,
        unitPrice: acrylicMat.price,
      });
    }
    formData.powerSupplies.forEach((item) => {
      const mat = materials.find((m) => m.id === item.materialId);
      if (mat && !materialsSnapshot.some((s) => s.materialId === mat.id)) {
        materialsSnapshot.push({
          materialId: mat.id,
          name: mat.name,
          category: mat.category,
          unit: mat.unit,
          unitPrice: mat.price,
        });
      }
    });
    formData.supplies.forEach((item) => {
      const mat = materials.find((m) => m.id === item.materialId);
      if (mat && !materialsSnapshot.some((s) => s.materialId === mat.id)) {
        materialsSnapshot.push({
          materialId: mat.id,
          name: mat.name,
          category: mat.category,
          unit: mat.unit,
          unitPrice: mat.price,
        });
      }
    });

    // 2. Client snapshot
    const selectedClient = formData.clientId
      ? clients.find((c) => c.id === formData.clientId)
      : undefined;

    const clientSnapshot = {
      name: formData.clientName,
      phone: formData.clientPhone,
      email: selectedClient?.email,
      city: selectedClient?.city,
      address: selectedClient?.address,
    };

    // 3. Business snapshot
    const businessSnapshot = {
      tradeName: businessProfile.tradeName,
      responsibleName: businessProfile.responsibleName,
      whatsapp: businessProfile.whatsapp,
      instagram: businessProfile.instagram,
      city: businessProfile.city,
      address: businessProfile.address,
      website: businessProfile.website,
      logoDataUrl: '', // Safe from quota bloat; loaded dynamically from IndexedDB when generating PDF
      depositPercentage:
        typeof businessProfile.depositPercentage === 'number'
          ? businessProfile.depositPercentage
          : 50,
      commercialConditions: businessProfile.commercialConditions,
      paymentMethods: businessProfile.paymentMethods,
    };

    if (existingQuoteId) {
      const updated = await quoteRepository.update(existingQuoteId, {
        clientId: formData.clientId,
        formData: { ...formData },
        calculationResult: { ...calculationResult },
        materialsSnapshot,
        clientSnapshot,
        businessSnapshot,
      });

      setQuotes((prev) => prev.map((q) => (q.id === existingQuoteId ? updated : q)));
      setEditingQuote(null);
      addToast(
        'success',
        'Presupuesto actualizado',
        `Se guardaron los cambios del presupuesto ${updated.quoteNumber}.`
      );
      return updated;
    } else {
      const created = await quoteRepository.create({
        clientId: formData.clientId,
        status: 'pendiente',
        formData: { ...formData },
        calculationResult: { ...calculationResult },
        materialsSnapshot,
        clientSnapshot,
        businessSnapshot,
      });

      setQuotes((prev) => [created, ...prev]);
      setEditingQuote(null);
      addToast(
        'success',
        'Presupuesto guardado',
        `Se generó con éxito el presupuesto ${created.quoteNumber} para ${created.formData.clientName}.`
      );
      return created;
    }
  };

  const handleEditQuote = (quote: SavedQuote) => {
    setEditingQuote(quote);
    setCurrentSection('quote-builder');
    addToast(
      'info',
      `Editando ${quote.quoteNumber}`,
      `Los datos de "${quote.formData.signDescription || 'Cartel'}" fueron cargados en el cotizador.`
    );
  };

  const handleCancelEditQuote = () => {
    setEditingQuote(null);
  };

  const handleDuplicateQuote = async (id: string) => {
    try {
      const duplicated = await quoteRepository.duplicate(id);
      setQuotes((prev) => [duplicated, ...prev]);
      addToast(
        'success',
        'Presupuesto duplicado',
        `Se creó el nuevo presupuesto ${duplicated.quoteNumber} como copia del original.`
      );
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al duplicar', 'No se pudo duplicar el presupuesto.');
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      await quoteRepository.delete(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      addToast('success', 'Presupuesto eliminado', 'El presupuesto fue eliminado permanentemente.');
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al eliminar', 'No se pudo eliminar el presupuesto.');
    }
  };

  const handleUpdateQuoteStatus = async (id: string, status: QuoteStatus) => {
    try {
      const updated = await quoteRepository.updateStatus(id, status);
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      addToast(
        'success',
        'Estado modificado',
        `El presupuesto ${updated.quoteNumber} ahora está en estado "${status}".`
      );
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al actualizar estado', 'No se pudo modificar el estado del presupuesto.');
    }
  };

  // Client Actions
  const handleCreateClient = async (data: ClientFormData) => {
    try {
      const created = await clientRepository.create(data);
      setClients((prev) => [created, ...prev]);
      addToast('success', 'Cliente registrado', `"${created.name}" fue agregado al directorio de clientes.`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al registrar cliente', error instanceof Error ? error.message : 'No se pudo registrar el cliente.');
      throw error;
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<ClientFormData>) => {
    try {
      const updated = await clientRepository.update(id, updates);
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast('success', 'Cliente actualizado', `Los datos de "${updated.name}" se guardaron correctamente.`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al modificar cliente', error instanceof Error ? error.message : 'No se pudo actualizar el cliente.');
      throw error;
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await clientRepository.delete(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      addToast('success', 'Cliente eliminado', 'El cliente fue eliminado del directorio.');
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al eliminar cliente', error instanceof Error ? error.message : 'No se pudo eliminar el cliente.');
      throw error;
    }
  };

  // Supplier Actions
  const handleCreateSupplier = async (data: SupplierFormData) => {
    try {
      const created = await supplierRepository.create(data);
      setSuppliers((prev) => [created, ...prev]);
      addToast('success', 'Proveedor registrado', `"${created.tradeName}" fue agregado al directorio de proveedores.`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al registrar proveedor', error instanceof Error ? error.message : 'No se pudo registrar el proveedor.');
      throw error;
    }
  };

  const handleUpdateSupplier = async (id: string, updates: Partial<SupplierFormData>) => {
    try {
      const updated = await supplierRepository.update(id, updates);
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast('success', 'Proveedor actualizado', `Los datos de "${updated.tradeName}" se guardaron correctamente.`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al modificar proveedor', error instanceof Error ? error.message : 'No se pudo actualizar el proveedor.');
      throw error;
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await supplierRepository.delete(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      addToast('success', 'Proveedor eliminado', 'El proveedor fue eliminado del directorio.');
    } catch (error) {
      console.error(error);
      addToast('error', 'Error al eliminar proveedor', error instanceof Error ? error.message : 'No se pudo eliminar el proveedor.');
      throw error;
    }
  };

  // Determine top bar quick actions based on section
  const getHeaderQuickAction = () => {
    if (currentSection === 'materials') {
      return {
        label: '+ Nuevo Material',
        action: () => setCurrentSection('materials'),
      };
    }
    if (currentSection === 'quotes') {
      return {
        label: '+ Nueva Cotización',
        action: () => {
          setEditingQuote(null);
          setCurrentSection('quote-builder');
        },
      };
    }
    if (currentSection === 'clients') {
      return {
        label: '+ Nuevo Cliente',
        action: () => setCurrentSection('clients'),
      };
    }
    if (currentSection === 'suppliers') {
      return {
        label: '+ Nuevo Proveedor',
        action: () => setCurrentSection('suppliers'),
      };
    }
    if (currentSection === 'business' && !businessProfile.tradeName) {
      return {
        label: 'Completar Taller',
        action: () => setCurrentSection('business'),
      };
    }
    return undefined;
  };

  const quickAction = getHeaderQuickAction();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Toast Feedback notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        materialsCount={materials.length}
        quotesCount={quotes.length}
        clientsCount={clients.length}
        suppliersCount={suppliers.length}
        isBusinessConfigured={Boolean(businessProfile.tradeName && businessProfile.whatsapp)}
        logoDataUrl={businessProfile.logoDataUrl}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          tradeName={businessProfile.tradeName}
          quickActionLabel={quickAction?.label}
          onQuickAction={quickAction?.action}
        />

        {/* Dynamic Section Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Cargando base de datos local...</span>
            </div>
          ) : (
            <>
              {currentSection === 'dashboard' && (
                <DashboardSection
                  business={businessProfile}
                  materials={materials}
                  quotes={quotes}
                  clients={clients}
                  suppliers={suppliers}
                  onNavigate={(sec) => setCurrentSection(sec)}
                />
              )}

              {currentSection === 'business' && (
                <BusinessSection
                  initialProfile={businessProfile}
                  onSave={handleSaveBusinessProfile}
                  isLoading={isLoading}
                />
              )}

              {currentSection === 'materials' && (
                <MaterialsSection
                  materials={materials}
                  categories={categories}
                  onCreateMaterial={handleCreateMaterial}
                  onUpdateMaterial={handleUpdateMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  isLoading={isLoading}
                />
              )}

              {currentSection === 'quote-builder' && (
                <QuoteBuilderSection
                  materials={materials}
                  businessProfile={businessProfile}
                  clients={clients}
                  editingQuote={editingQuote}
                  onSaveQuote={handleSaveQuote}
                  onCancelEdit={handleCancelEditQuote}
                  onNavigateToMaterials={() => setCurrentSection('materials')}
                  onNavigateToQuotes={() => setCurrentSection('quotes')}
                />
              )}

              {currentSection === 'quotes' && (
                <QuotesSection
                  quotes={quotes}
                  onEditQuote={handleEditQuote}
                  onDuplicateQuote={handleDuplicateQuote}
                  onDeleteQuote={handleDeleteQuote}
                  onUpdateStatus={handleUpdateQuoteStatus}
                  onNavigateToQuoteBuilder={() => {
                    setEditingQuote(null);
                    setCurrentSection('quote-builder');
                  }}
                  isLoading={isLoading}
                />
              )}

              {currentSection === 'clients' && (
                <ClientsSection
                  clients={clients}
                  quotes={quotes}
                  onCreateClient={handleCreateClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onOpenQuoteDetails={(quote) => {
                    setEditingQuote(quote);
                    setCurrentSection('quotes');
                  }}
                  isLoading={isLoading}
                />
              )}

              {currentSection === 'suppliers' && (
                <SuppliersSection
                  suppliers={suppliers}
                  categories={categories}
                  onCreateSupplier={handleCreateSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
