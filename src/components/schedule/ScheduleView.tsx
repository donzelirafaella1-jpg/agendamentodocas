import React, { useState, useMemo } from 'react';
import { useTMS } from '../../context/TMSContext';
import { Appointment } from '../../types';
import { timeToMinutes } from '../../services/yardCapacityService';
import {
  CalendarRange,
  Clock,
  Filter,
  Truck,
  Building,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const { appointments, carriers, drivers, docks, selectedDate, setSelectedDate } = useTMS();

  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedDockFilter, setSelectedDockFilter] = useState<string>('ALL');

  const carrierMap = useMemo(() => new Map(carriers.map((c) => [c.id, c.tradeName])), [carriers]);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);

  // Operational Hours slices: 07:00 to 16:00
  const timeHours = [
    '07:00', '08:00', '09:00', '10:00',
    '11:00', // Lunch block
    '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  // Filtered by selected dock if any
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (app.date !== selectedDate) return false;
      if (selectedDockFilter !== 'ALL') {
        if (!app.assignedDockId || app.assignedDockId.toString() !== selectedDockFilter) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => timeToMinutes(a.windowStart) - timeToMinutes(b.windowStart));
  }, [appointments, selectedDate, selectedDockFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Agenda Diária de Cargas & Descargas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grade horária dos 32 caminhões diários nas 14 docas · Intervalo 11:00–12:00 bloqueado
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Linha do Tempo</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Visão Detalhada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Data Operacional:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Filtrar por Doca:</span>
          <select
            value={selectedDockFilter}
            onChange={(e) => setSelectedDockFilter(e.target.value)}
            className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="ALL">Todas as 14 Docas</option>
            {docks.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name} ({d.cargoSpecialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="space-y-4">
          {timeHours.map((hourStr) => {
            const isLunch = hourStr === '11:00';
            const hourStartM = timeToMinutes(hourStr);
            const hourEndM = hourStartM + 60;

            const appsInThisHour = filteredAppointments.filter((a) => {
              const appM = timeToMinutes(a.windowStart);
              return appM >= hourStartM && appM < hourEndM;
            });

            return (
              <div
                key={hourStr}
                className={`rounded-xl border transition-all ${
                  isLunch
                    ? 'border-slate-300 bg-slate-100/90 text-slate-600'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Hour Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-mono text-sm font-bold text-slate-900">{hourStr}</span>
                    {isLunch ? (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Intervalo de Almoço Operacional Obrigatório (Bloqueado)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        {appsInThisHour.length} agendamento(s)
                      </span>
                    )}
                  </div>

                  {!isLunch && (
                    <span className="text-[11px] font-mono text-slate-500">
                      Capacidade pátio no período: {Math.min(8, appsInThisHour.length + 3)}/8
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  {isLunch ? (
                    <div className="py-2 text-center text-xs text-slate-500 font-medium">
                      Pátio e docas bloqueados para movimentação entre 11:00 e 12:00 conforme acordo coletivo Move Log.
                    </div>
                  ) : appsInThisHour.length === 0 ? (
                    <div className="py-2 text-center text-xs text-slate-400">
                      Nenhum caminhão agendado para este horário.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {appsInThisHour.map((app) => {
                        const carrier = carrierMap.get(app.carrierId);
                        const driver = driverMap.get(app.driverId);
                        return (
                          <div
                            key={app.id}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span>{app.windowStart}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-900">{app.vehiclePlate}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700">
                                {app.assignedDockId ? `Doca ${app.assignedDockId.toString().padStart(2, '0')}` : 'Doca Flex'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="font-medium truncate max-w-[150px]">{carrier}</span>
                              <span className="font-mono text-slate-500">
                                {(app.cargoWeightKg / 1000).toFixed(1)}t
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-slate-500 truncate">{app.cargoType}</span>
                              <span
                                className={`font-semibold ${
                                  app.status === 'DESCARREGANDO'
                                    ? 'text-blue-700'
                                    : app.status === 'NO_PATIO'
                                    ? 'text-emerald-700'
                                    : app.status === 'NA_FILA'
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
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
                                  : 'Agendado'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Horário</th>
                  <th className="py-3 px-3.5">Placa & Veículo</th>
                  <th className="py-3 px-3.5">Motorista</th>
                  <th className="py-3 px-3.5">Transportadora</th>
                  <th className="py-3 px-3.5">Carga & Peso</th>
                  <th className="py-3 px-3.5">Prioridade</th>
                  <th className="py-3 px-3.5">Doca</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Tempos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors font-normal">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {app.windowStart} - {app.windowEnd}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-medium text-slate-900">
                      {app.vehiclePlate} ({app.vehicleType})
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-800">
                      {driverMap.get(app.driverId) || 'Motorista'}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                      {carrierMap.get(app.carrierId) || 'Transportadora'}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-900">{app.cargoType}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {(app.cargoWeightKg / 1000).toFixed(1)}t
                      </div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-semibold">
                      {app.priority === 'URGENTE_PERECIVEL' ? (
                        <span className="text-amber-700">Perecível</span>
                      ) : app.priority === 'FARMA_CONTROLADO' ? (
                        <span className="text-blue-700">Farma ANVISA</span>
                      ) : (
                        <span className="text-slate-600">{app.priority}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {app.assignedDockId ? `Doca ${app.assignedDockId.toString().padStart(2, '0')}` : '-'}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium">
                      <span
                        className={
                          app.status === 'DESCARREGANDO'
                            ? 'text-blue-700 font-bold'
                            : app.status === 'NO_PATIO'
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-700'
                        }
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {app.estimatedDurationMinutes}m descarga / {app.estimatedStayMinutes}m permanência
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
