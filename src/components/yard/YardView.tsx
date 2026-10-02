import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import {
  Warehouse,
  Truck,
  Clock,
  ArrowRight,
  LogOut,
  ListOrdered,
  Container,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const YardView: React.FC = () => {
  const {
    yardSlots,
    appointments,
    carriers,
    drivers,
    docks,
    assignToDock,
    moveToQueue,
    registerDeparture,
    currentTimeStr,
  } = useTMS();

  const [selectedSlotForDock, setSelectedSlotForDock] = useState<number | null>(null);
  const [targetDockId, setTargetDockId] = useState<number>(1);

  const carrierMap = new Map(carriers.map((c) => [c.id, c.tradeName]));
  const driverMap = new Map(drivers.map((d) => [d.id, d.name]));

  const occupiedCount = yardSlots.filter((s) => s.isOccupied).length;

  const handleOpenDockModal = (slotId: number) => {
    setSelectedSlotForDock(slotId);
    // Suggest first free dock
    const free = docks.find((d) => d.status === 'LIVRE' && !d.isMaintenance);
    if (free) setTargetDockId(free.id);
  };

  const handleConfirmDockAllocation = () => {
    if (!selectedSlotForDock) return;
    const slot = yardSlots.find((s) => s.id === selectedSlotForDock);
    if (!slot || !slot.currentAppointmentId) return;

    const res = assignToDock(slot.currentAppointmentId, targetDockId);
    alert(res.message);
    setSelectedSlotForDock(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Controle Visual do Pátio (8 Vagas Físicas)
            </h1>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                occupiedCount >= 8
                  ? 'bg-rose-100 text-rose-800'
                  : occupiedCount >= 6
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Ocupação: {occupiedCount}/8
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de permanência, vagas livres e despacho para as 14 docas
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Vaga Livre ({8 - occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-900" />
            <span>Vaga Ocupada ({occupiedCount})</span>
          </div>
        </div>
      </div>

      {/* Visual Yard Map Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {yardSlots.map((slot) => {
          const app = appointments.find((a) => a.id === slot.currentAppointmentId);
          const carrier = app ? carrierMap.get(app.carrierId) : null;
          const driver = app ? driverMap.get(app.driverId) : null;

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between min-h-[220px] ${
                slot.isOccupied
                  ? 'border-slate-800/20 bg-white shadow-xs'
                  : 'border-dashed border-emerald-300 bg-emerald-50/20'
              }`}
            >
              {/* Top Slot Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{slot.name}</span>
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    slot.isOccupied ? 'text-slate-900' : 'text-emerald-700'
                  }`}
                >
                  {slot.isOccupied ? 'Ocupada' : 'Disponível'}
                </span>
              </div>

              {/* Slot Body */}
              <div className="my-3">
                {slot.isOccupied && app ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-slate-900">
                        {app.vehiclePlate}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {app.vehicleType}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      <p className="font-semibold truncate">{carrier || 'Transportadora'}</p>
                      <p className="text-[11px] text-slate-500 truncate">Condutor: {driver || 'N/A'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>No pátio desde:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {slot.parkedSince || app.actualYardEntryTime || '09:00'}
                      </span>
                    </div>

                    <div className="text-[11px] flex justify-between">
                      <span className="text-slate-500">Carga:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[130px]">
                        {app.cargoType}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full py-8 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-800">Vaga Livre</span>
                    <span className="text-[10px] text-emerald-600 mt-0.5">Pronta para alocação</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {slot.isOccupied && app && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDockModal(slot.id)}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Container className="h-3 w-3" />
                    <span>Doca</span>
                  </button>

                  <button
                    onClick={() => moveToQueue(app.id, 'Movido do pátio para fila de espera')}
                    title="Mover para fila de espera"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => registerDeparture(app.id)}
                    title="Registrar saída do CD (liberar vaga)"
                    className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dock Allocation Modal */}
      {selectedSlotForDock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Despachar Veículo para Doca de Descarga
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione uma das 14 docas disponíveis para iniciar a operação.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doca de Destino (14 Docas Move Log)
              </label>
              <select
                value={targetDockId}
                onChange={(e) => setTargetDockId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
              >
                {docks.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.isMaintenance}>
                    {d.name} · {d.cargoSpecialty} ({d.status === 'LIVRE' ? 'Livre' : d.status})
                    {d.isMaintenance ? ' - Manutenção' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlotForDock(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDockAllocation}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Confirmar Alocação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
