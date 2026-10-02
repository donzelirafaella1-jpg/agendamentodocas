import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import {
  ListOrdered,
  Clock,
  ArrowRight,
  Container,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const QueueView: React.FC = () => {
  const { queue, appointments, carriers, docks, assignToDock } = useTMS();

  const [selectedDockId, setSelectedDockId] = useState<number>(1);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const carrierMap = new Map(carriers.map((c) => [c.id, c.tradeName]));
  const freeDocks = docks.filter((d) => d.status === 'LIVRE' && !d.isMaintenance);

  const handleDispatch = (appId: string) => {
    setSelectedAppointmentId(appId);
    if (freeDocks.length > 0) {
      setSelectedDockId(freeDocks[0].id);
    }
  };

  const confirmDispatch = () => {
    if (!selectedAppointmentId) return;
    const res = assignToDock(selectedAppointmentId, selectedDockId);
    alert(res.message);
    setSelectedAppointmentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Fila de Espera Dinâmica
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {queue.length} veículos em espera
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ordenação inteligente por criticidade (Perecíveis & ANVISA prioritários) e ordem cronológica (FIFO)
          </p>
        </div>

        <div className="text-xs text-slate-600 font-medium">
          Docas Livres para Chamada: <strong className="text-emerald-700 font-mono">{freeDocks.length}/14</strong>
        </div>
      </div>

      {/* Queue Cards */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Veículos Aguardando Liberação de Docas ({queue.length})
          </span>
          <span className="text-xs text-slate-400">
            Atualização em tempo real conforme finalização de descargas
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">Nenhum veículo aguardando na fila.</p>
            <p className="text-slate-400 mt-0.5">Todas as descargas estão fluindo dentro do tempo padrão.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item, index) => {
              const app = appointments.find((a) => a.id === item.appointmentId);
              const carrier = app ? carrierMap.get(app.carrierId) : null;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                      #{index + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {app?.vehiclePlate}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700">{carrier}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{app?.cargoType}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Na fila desde: <strong className="font-mono text-slate-800">{item.enteredAt}</strong></span>
                        </span>
                        <span>·</span>
                        <span className="text-slate-600 font-medium">Motivo: {item.reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority & Dispatch CTA */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`font-bold ${
                        item.priority === 'URGENTE_PERECIVEL'
                          ? 'text-amber-700'
                          : item.priority === 'FARMA_CONTROLADO'
                          ? 'text-blue-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.priority === 'URGENTE_PERECIVEL'
                        ? 'Prioridade Urgente'
                        : item.priority === 'FARMA_CONTROLADO'
                        ? 'Prioridade Farma'
                        : 'Normal'}
                    </span>

                    <button
                      onClick={() => handleDispatch(item.appointmentId)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Despachar para Doca</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {selectedAppointmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Chamar Veículo da Fila para Doca
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O motorista será orientado a estacionar na doca selecionada imediatamente.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecione a Doca Livre
              </label>
              <select
                value={selectedDockId}
                onChange={(e) => setSelectedDockId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
              >
                {docks.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.isMaintenance || d.status === 'EM_OPERACAO'}>
                    {d.name} · {d.cargoSpecialty} ({d.status === 'LIVRE' ? 'Livre' : d.status})
                    {d.isMaintenance ? ' - Manutenção' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppointmentId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDispatch}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Confirmar e Iniciar Operação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
