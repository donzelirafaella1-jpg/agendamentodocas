import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import {
  Container,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Wrench,
  Truck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const DocksView: React.FC = () => {
  const {
    docks,
    appointments,
    carriers,
    startUnloading,
    pauseUnloading,
    finishUnloading,
    assignToDock,
    queue,
    currentTimeStr,
  } = useTMS();

  const [selectedDockForSummon, setSelectedDockForSummon] = useState<number | null>(null);

  const carrierMap = new Map(carriers.map((c) => [c.id, c.tradeName]));

  const activeCount = docks.filter((d) => d.status === 'EM_OPERACAO').length;
  const freeCount = docks.filter((d) => d.status === 'LIVRE' && !d.isMaintenance).length;
  const maintenanceCount = docks.filter((d) => d.isMaintenance).length;

  const handleSummonFromQueue = (dockId: number, appointmentId: string) => {
    const res = assignToDock(appointmentId, dockId);
    alert(res.message);
    setSelectedDockForSummon(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Painel de Gestão das 14 Docas de Descarga
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Ativas: {activeCount}/14
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bloqueio anti-conflito de veículos · Docas climatizadas (01 e 02) e pesadas (13 e 14)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <span className="text-slate-700">Em Operação ({activeCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-slate-700">Livres ({freeCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            <span className="text-slate-700">Manutenção ({maintenanceCount})</span>
          </div>
        </div>
      </div>

      {/* Grid of 14 Docks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {docks.map((dock) => {
          const app = appointments.find((a) => a.id === dock.currentAppointmentId);
          const carrier = app ? carrierMap.get(app.carrierId) : null;

          return (
            <div
              key={dock.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between min-h-[240px] transition-all ${
                dock.isMaintenance
                  ? 'border-slate-200 bg-slate-50/80 text-slate-500'
                  : dock.status === 'EM_OPERACAO'
                  ? 'border-blue-200 bg-white shadow-xs'
                  : dock.status === 'AGUARDANDO_VEICULO'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Container className="h-4 w-4 text-slate-700" />
                    <span className="font-mono text-sm font-bold text-slate-900">{dock.name}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      dock.isMaintenance
                        ? 'text-slate-500'
                        : dock.status === 'EM_OPERACAO'
                        ? 'text-blue-700'
                        : dock.status === 'AGUARDANDO_VEICULO'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {dock.isMaintenance
                      ? 'Manutenção'
                      : dock.status === 'EM_OPERACAO'
                      ? 'Descarregando'
                      : dock.status === 'AGUARDANDO_VEICULO'
                      ? 'Aguardando'
                      : 'Livre'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1 font-medium">{dock.cargoSpecialty}</p>

                {/* Truck Info if Occupied */}
                {dock.status === 'EM_OPERACAO' && app ? (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900">{app.vehiclePlate}</span>
                      <span className="text-slate-500 text-[11px]">
                        {(app.cargoWeightKg / 1000).toFixed(1)}t
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 truncate">{carrier || 'Transportadora'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{app.cargoType}</p>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                        <span>Progresso descarga</span>
                        <span className="font-bold text-blue-700">{dock.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dock.progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Início: {dock.startedOperationAt || '09:00'}</span>
                        <span>Previsto: {dock.estimatedCompletionAt || '10:00'}</span>
                      </div>
                    </div>
                  </div>
                ) : dock.isMaintenance ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <Wrench className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                    <p className="font-semibold text-slate-700">Doca Interditada</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{dock.maintenanceReason}</p>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
                    <p className="font-medium text-emerald-800">Doca Disponível</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sem agendamento ativo no momento</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100">
                {dock.status === 'EM_OPERACAO' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => pauseUnloading(dock.id, 'Pausa operacional')}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pausar</span>
                    </button>
                    <button
                      onClick={() => finishUnloading(dock.id)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Concluir</span>
                    </button>
                  </div>
                ) : dock.status === 'AGUARDANDO_VEICULO' ? (
                  <button
                    onClick={() => startUnloading(dock.id)}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Iniciar Descarregamento</span>
                  </button>
                ) : !dock.isMaintenance && queue.length > 0 ? (
                  <button
                    onClick={() => setSelectedDockForSummon(dock.id)}
                    className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Chamar da Fila ({queue.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to summon from Queue into specific free dock */}
      {selectedDockForSummon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Chamar Caminhão da Fila para Doca {selectedDockForSummon.toString().padStart(2, '0')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione um dos veículos em espera ordenada por prioridade:
            </p>

            <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
              {queue.map((item) => {
                const app = appointments.find((a) => a.id === item.appointmentId);
                const carrier = app ? carrierMap.get(app.carrierId) : null;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">
                        {app?.vehiclePlate} · {app?.cargoType}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {carrier} · Fila desde {item.enteredAt}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                        Prioridade: {item.priority}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSummonFromQueue(selectedDockForSummon, item.appointmentId)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
                    >
                      Alocar nesta Doca
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDockForSummon(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
