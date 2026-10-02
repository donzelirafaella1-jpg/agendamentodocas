import React, { useState, useMemo } from 'react';
import { useTMS } from '../../context/TMSContext';
import { AppointmentStatus, PriorityLevel } from '../../types';
import { NewAppointmentModal } from './NewAppointmentModal';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Building,
  MoreVertical,
  XCircle,
  ArrowRight,
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { appointments, carriers, cancelAppointment, performCheckIn, activeProfile } = useTMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const carrierMap = useMemo(() => {
    return new Map(carriers.map((c) => [c.id, c.tradeName]));
  }, [carriers]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        app.vehiclePlate.toLowerCase().includes(searchLower) ||
        app.code.toLowerCase().includes(searchLower) ||
        app.invoiceNumber.toLowerCase().includes(searchLower) ||
        (carrierMap.get(app.carrierId) || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;

      // Priority
      if (priorityFilter !== 'ALL' && app.priority !== priorityFilter) return false;

      // Carrier
      if (selectedCarrier !== 'ALL' && app.carrierId !== selectedCarrier) return false;

      return true;
    });
  }, [appointments, searchTerm, statusFilter, priorityFilter, selectedCarrier, carrierMap]);

  const handleQuickCheckIn = (appId: string) => {
    const res = performCheckIn(appId, 'Check-in rápido via tela de agendamentos');
    alert(res.message);
  };

  const handleCancel = (appId: string) => {
    const reason = prompt('Informe o motivo do cancelamento do agendamento:');
    if (reason && reason.trim()) {
      cancelAppointment(appId, reason.trim());
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Gestão de Agendamentos (32 Caminhões/Dia)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de janelas operacionais, regras de sobreposição do pátio e conformidade de docas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa (ex: BRA9E22), código, NF-e ou transportadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-900 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Todos os Status ({appointments.length})</option>
            <option value="AGENDADO">Agendados</option>
            <option value="NO_PATIO">No Pátio</option>
            <option value="NA_FILA">Na Fila</option>
            <option value="DESCARREGANDO">Descarregando</option>
            <option value="FINALIZADO">Finalizados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Todas Prioridades</option>
            <option value="URGENTE_PERECIVEL">Perecíveis Urgentes</option>
            <option value="FARMA_CONTROLADO">Farma Controlado</option>
            <option value="ALTA">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="BAIXA">Baixa</option>
          </select>

          {/* Carrier Filter */}
          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Todas Transportadoras</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tradeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Grid */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Horário Janela</th>
                <th className="py-3 px-3.5">Código / Placa</th>
                <th className="py-3 px-3.5">Transportadora</th>
                <th className="py-3 px-3.5">Carga & Peso</th>
                <th className="py-3 px-3.5">Prioridade</th>
                <th className="py-3 px-3.5">Doca / Pátio</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarDays className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Nenhum agendamento encontrado.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ajuste os filtros de busca ou cadastre um novo agendamento.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const carrierName = carrierMap.get(app.carrierId) || 'Transportadora';
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors group font-normal"
                    >
                      {/* Window Time */}
                      <td className="py-3 px-3.5 font-mono text-slate-900 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{app.windowStart}</span>
                          <span className="text-slate-400">→</span>
                          <span>{app.windowEnd}</span>
                        </div>
                        {app.isManualOverride && (
                          <span className="text-[10px] font-sans font-bold text-rose-600 block mt-0.5">
                            Sobrecarga Autorizada
                          </span>
                        )}
                      </td>

                      {/* Code and Vehicle Plate */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{app.vehiclePlate}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.code} · {app.vehicleType}
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900">{carrierName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          NF: {app.invoiceNumber}
                        </div>
                      </td>

                      {/* Cargo Type & Weight */}
                      <td className="py-3 px-3.5">
                        <div className="text-slate-900 font-medium">{app.cargoType}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {(app.cargoWeightKg / 1000).toFixed(1)} toneladas
                        </div>
                      </td>

                      {/* Priority (Unboxed clean text) */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium">
                        {app.priority === 'URGENTE_PERECIVEL' ? (
                          <span className="text-amber-700 font-bold">Urgente Perecível</span>
                        ) : app.priority === 'FARMA_CONTROLADO' ? (
                          <span className="text-blue-700 font-bold">Farma ANVISA</span>
                        ) : app.priority === 'ALTA' ? (
                          <span className="text-rose-700 font-semibold">Alta Prioridade</span>
                        ) : (
                          <span className="text-slate-600">Normal</span>
                        )}
                      </td>

                      {/* Dock & Yard Bay */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono">
                        <div>
                          {app.assignedDockId ? (
                            <span className="text-slate-900 font-bold">
                              Doca {app.assignedDockId.toString().padStart(2, '0')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Doca Livre</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app.assignedYardSlotId ? `Vaga P-0${app.assignedYardSlotId}` : 'Sem vaga fixa'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            app.status === 'DESCARREGANDO'
                              ? 'text-blue-700'
                              : app.status === 'NO_PATIO'
                              ? 'text-emerald-700'
                              : app.status === 'NA_FILA'
                              ? 'text-amber-700'
                              : app.status === 'FINALIZADO'
                              ? 'text-slate-500'
                              : app.status === 'CANCELADO'
                              ? 'text-rose-600 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {app.status === 'DESCARREGANDO'
                            ? 'Descarregando'
                            : app.status === 'NO_PATIO'
                            ? 'No Pátio'
                            : app.status === 'NA_FILA'
                            ? 'Na Fila'
                            : app.status === 'FINALIZADO'
                            ? 'Finalizado'
                            : app.status === 'CANCELADO'
                            ? 'Cancelado'
                            : 'Agendado'}
                        </span>
                        {app.delayCategory && app.delayCategory !== 'PONTUAL' && (
                          <span
                            className={`block text-[10px] font-mono ${
                              app.delayCategory === 'ATRASADO' ? 'text-rose-600' : 'text-blue-600'
                            }`}
                          >
                            {app.delayMinutes && app.delayMinutes > 0 ? `+${app.delayMinutes}m` : `${app.delayMinutes}m`}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === 'AGENDADO' && (
                            <button
                              onClick={() => handleQuickCheckIn(app.id)}
                              title="Registrar Check-in na portaria"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition-colors"
                            >
                              Check-in
                            </button>
                          )}
                          {app.status !== 'FINALIZADO' && app.status !== 'CANCELADO' && (
                            <button
                              onClick={() => handleCancel(app.id)}
                              title="Cancelar agendamento"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <NewAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
