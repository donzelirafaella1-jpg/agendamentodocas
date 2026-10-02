import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface OverrideConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  title?: string;
  warningMessage: string;
  proposedTime: string;
  vehiclePlate: string;
}

export const OverrideConfirmModal: React.FC<OverrideConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmação de Liberação Manual com Sobrecarga',
  warningMessage,
  proposedTime,
  vehiclePlate,
}) => {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!justification.trim() || justification.trim().length < 8) {
      setError('A justificativa operacional é obrigatória (mínimo 8 caracteres) para fins de auditoria.');
      return;
    }
    setError('');
    onConfirm(justification.trim());
    setJustification('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta ação violará a política operacional de capacidade do pátio e gerará registro no log de auditoria permanente.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Alerta de Sobrecarga de Pátio</span>
          </div>
          <p className="font-semibold">{warningMessage}</p>
          <div className="mt-2 pt-2 border-t border-rose-200 flex items-center justify-between text-[11px]">
            <span>Veículo: <strong>{vehiclePlate || 'N/A'}</strong></span>
            <span>Horário solicitado: <strong>{proposedTime}</strong></span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Justificativa Obrigatória para Auditoria Logística *
          </label>
          <textarea
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value);
              if (error) setError('');
            }}
            placeholder="Descreva o motivo da exceção (ex: Carga urgente perecível com liberação expressa da diretoria de suprimentos...)"
            rows={3}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
          />
          {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar e Escolher Outro Horário
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
          >
            Confirmar Sobrecarga e Registrar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
