import React from 'react';
import {
  Building2,
  Package,
  Calculator,
  FileText,
  Users,
  Truck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile } from '../../types/business';
import { Material } from '../../types/material';
import { SavedQuote } from '../../types/quote';
import { Client } from '../../types/client';
import { Supplier } from '../../types/supplier';
import { NavigationSection } from '../../types/navigation';

interface DashboardSectionProps {
  business: BusinessProfile;
  materials: Material[];
  quotes: SavedQuote[];
  clients: Client[];
  suppliers: Supplier[];
  onNavigate: (section: NavigationSection) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  business,
  materials,
  quotes,
  clients,
  suppliers,
  onNavigate,
}) => {
  const isBusinessConfigured = Boolean(business.tradeName && business.whatsapp);
  const activeMaterials = materials.filter((m) => m.isActive);

  // Group materials by category for real breakdown
  const categoryCounts = materials.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  // Group quotes by status
  const quoteStatusCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2 tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Panel de Control · Fase 3 Activa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            {business.tradeName
              ? `Taller ${business.tradeName}`
              : 'Bienvenido a Cotizador Neón'}
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Plataforma integral para talleres de cartelería LED Neon Flex.
            Disponés de motor de cotización con cálculo exacto en ARS, historial de presupuestos con congelamiento de precios, exportación de PDF comercial, directorio de clientes y proveedores.
          </p>
        </div>
      </div>

      {/* Real Workshop Operational Status (No fake metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Business Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Datos del Taller</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              {isBusinessConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              <h3 className="text-base font-semibold text-white">
                {isBusinessConfigured ? 'Configurado' : 'Pendiente de completar'}
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {isBusinessConfigured
                ? `Responsable: ${business.responsibleName || 'No indicado'} · WhatsApp: ${business.whatsapp}`
                : 'Completá los datos de tu taller para que se incluyan en tus presupuestos y PDF.'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Mi negocio</span>
            <button
              onClick={() => onNavigate('business')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>{isBusinessConfigured ? 'Editar datos' : 'Completar ahora'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quotes Real Count Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Presupuestos Guardados</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {quotes.length}
              </span>
              <span className="text-xs text-slate-400">
                presupuestos registrados
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {quotes.length === 0
                ? 'Aún no guardaste presupuestos. Creá tu primera cotización en el Cotizador.'
                : `${quoteStatusCounts['pendiente'] || 0} pendientes · ${quoteStatusCounts['enviado'] || 0} enviados · ${quoteStatusCounts['aceptado'] || 0} aceptados`}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Historial y PDF</span>
            <button
              onClick={() => onNavigate('quotes')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Ver presupuestos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Materials Real Count Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Catálogo de Materiales</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {materials.length}
              </span>
              <span className="text-xs text-slate-400">
                materiales ({activeMaterials.length} activos)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {materials.length === 0
                ? 'Aún no cargaste materiales. Podés crear neón, acrílicos, fuentes e insumos.'
                : `${Object.keys(categoryCounts).length} categorías con precios en pesos argentinos (ARS).`}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Materiales</span>
            <button
              onClick={() => onNavigate('materials')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Gestionar catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clients Count Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Cartera de Clientes</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {clients.length}
              </span>
              <span className="text-xs text-slate-400">clientes registrados</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {clients.length === 0
                ? 'Registrá tus clientes para autocompletar presupuestos y contactarlos por WhatsApp.'
                : 'Directorio con historial de cotizaciones asociadas y contacto directo.'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Clientes</span>
            <button
              onClick={() => onNavigate('clients')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Ver clientes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Suppliers Count Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Proveedores de Insumos</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {suppliers.length}
              </span>
              <span className="text-xs text-slate-400">proveedores registrados</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {suppliers.length === 0
                ? 'Agregá tus proveedores de Neón LED, acrílicos y fuentes de alimentación.'
                : 'Directorio clasificado por rubro con acceso directo a WhatsApp y web.'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Proveedores</span>
            <button
              onClick={() => onNavigate('suppliers')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Ver proveedores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* System Roadmap Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Plan de Desarrollo</span>
              <span className="text-xs font-mono text-cyan-400">Fase 3 / 4</span>
            </div>

            <h3 className="text-base font-semibold text-white mb-2">
              Gestión Comercial & PDF Activo
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Historial con congelamiento de precios, exportación de PDF comercial profesional, WhatsApp y directorios activos.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Cotizador</span>
            <button
              onClick={() => onNavigate('quote-builder')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Crear presupuesto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Materials Breakdown (if any exist) */}
      {materials.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Distribución de Materiales Registrados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Resumen obtenido directamente de tu catálogo guardado
              </p>
            </div>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div
                key={cat}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="text-xs text-slate-400 truncate mb-1">{cat}</div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {count} <span className="text-xs font-normal text-slate-400">ítems</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Shortcuts Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Accesos Directos</h3>
          <p className="text-xs text-slate-400">
            Navegá entre las 7 secciones del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('business')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Mi Negocio</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Datos comerciales, formas de pago y condiciones del taller.
            </p>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
              <span>Materiales</span>
              <span className="text-[10px] font-mono text-cyan-400">{materials.length}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alta, edición, categorías y precios unitarios en ARS.
            </p>
          </button>

          <button
            onClick={() => onNavigate('quote-builder')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
              <span>Cotizador</span>
              <span className="text-[10px] font-mono text-emerald-400">Activo</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cálculo de acrílico, neón, fuentes, diagrama y precios.
            </p>
          </button>

          <button
            onClick={() => onNavigate('quotes')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
              <span>Presupuestos</span>
              <span className="text-[10px] font-mono text-cyan-400">{quotes.length}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Historial con congelamiento, estados y PDF profesional.
            </p>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
              <span>Clientes</span>
              <span className="text-[10px] font-mono text-cyan-400">{clients.length}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directorio de clientes y cotizaciones asociadas.
            </p>
          </button>

          <button
            onClick={() => onNavigate('suppliers')}
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
              <span>Proveedores</span>
              <span className="text-[10px] font-mono text-cyan-400">{suppliers.length}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proveedores de Neón LED, insumos y fuentes.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
