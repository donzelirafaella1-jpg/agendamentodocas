import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import { getCarrierBreakdown } from '../../services/reportService';
import {
  Building,
  User,
  Phone,
  Mail,
  CheckCircle2,
  TrendingUp,
  Truck,
  Search,
} from 'lucide-react';

export const CarriersView: React.FC = () => {
  const { carriers, drivers, appointments } = useTMS();

  const [activeTab, setActiveTab] = useState<'carriers' | 'drivers'>('carriers');
  const [searchQuery, setSearchQuery] = useState('');

  const carrierBreakdown = getCarrierBreakdown(appointments, carriers);

  const filteredCarriers = carrierBreakdown.filter(
    (c) =>
      c.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnpj.includes(searchQuery)
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cnh.includes(searchQuery) ||
      d.cpf.includes(searchQuery)
  );

  const carrierMap = new Map(carriers.map((c) => [c.id, c.tradeName]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Transportadoras Homologadas & Motoristas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastros parceiros, SLAs de pontualidade contratual e condutores credenciados
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'carriers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transportadoras ({carriers.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'drivers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Motoristas ({drivers.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'carriers' ? "Buscar por razão social ou CNPJ..." : "Buscar por nome, CNH ou CPF..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none placeholder-slate-400"
        />
      </div>

      {activeTab === 'carriers' ? (
        /* CARRIERS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCarriers.map((carrier) => {
            const raw = carriers.find((c) => c.id === carrier.carrierId);
            return (
              <div
                key={carrier.carrierId}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{carrier.tradeName}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{carrier.cnpj}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {carrier.punctualityRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">SLA Pontualidade</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Hoje</span>
                    <span className="font-mono font-bold text-slate-800">{carrier.scheduledTrucks} caminhões</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Concluídos</span>
                    <span className="font-mono font-bold text-emerald-700">{carrier.completed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Volume</span>
                    <span className="font-mono font-bold text-slate-800">{carrier.totalVolumeTons}t</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{raw?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{raw?.email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DRIVERS TABLE */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Nome do Motorista</th>
                <th className="py-3 px-3.5">Transportadora</th>
                <th className="py-3 px-3.5">CNH / Categoria</th>
                <th className="py-3 px-3.5">CPF</th>
                <th className="py-3 px-3.5">Telefone</th>
                <th className="py-3 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {driver.name.charAt(0)}
                    </div>
                    <span>{driver.name}</span>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800">
                    {carrierMap.get(driver.carrierId) || 'Transportadora'}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-slate-800">
                    {driver.cnh} <span className="font-bold text-emerald-700">(Cat. {driver.cnhCategory})</span>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-slate-500">{driver.cpf}</td>
                  <td className="py-3 px-3.5 font-mono text-slate-600">{driver.phone}</td>
                  <td className="py-3 px-3.5">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Credenciado</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
