import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import { UserRole } from '../../types';
import {
  Settings,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Warehouse,
  Container,
  User,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    config,
    company,
    availableProfiles,
    activeProfile,
    switchProfile,
    auditLogs,
    resetToInitialDemo,
    updateConfig,
    hasPermission,
  } = useTMS();

  const [activeTab, setActiveTab] = useState<'audit' | 'params' | 'profiles' | 'company'>('audit');
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === 'OVERRIDES') return log.isOverrideAlert;
    if (auditFilter === 'PATIO') return log.entityType === 'PATIO';
    if (auditFilter === 'DOCA') return log.entityType === 'DOCA';
    if (auditFilter === 'AGENDAMENTO') return log.entityType === 'AGENDAMENTO';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Configurações do Sistema & Histórico de Auditoria
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Governança operacional, parâmetros do CD Move Log e trilha de auditoria completa
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trilha de Auditoria ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'params' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parâmetros CD
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'profiles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perfis de Acesso
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'company' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Empresa / Multi-Tenant
          </button>
        </div>
      </div>

      {activeTab === 'audit' && (
        /* AUDIT LOG TABLE */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Filtrar Eventos:</span>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-none"
              >
                <option value="ALL">Todos os Eventos ({auditLogs.length})</option>
                <option value="OVERRIDES">Somente Liberações com Sobrecarga</option>
                <option value="AGENDAMENTO">Agendamentos</option>
                <option value="PATIO">Movimentações de Pátio</option>
                <option value="DOCA">Operações de Docas</option>
              </select>
            </div>

            <div className="text-slate-500">
              Registros imutáveis com carimbo de data, hora e perfil do operador.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Data / Hora</th>
                    <th className="py-3 px-3.5">Usuário / Perfil</th>
                    <th className="py-3 px-3.5">Ação Operacional</th>
                    <th className="py-3 px-3.5">Detalhes da Ocorrência</th>
                    <th className="py-3 px-3.5">Justificativa / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        log.isOverrideAlert ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-900 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="text-slate-400 block text-[10px]">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.userRole}</div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {log.isOverrideAlert ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>SOBRECARGA AUTORIZADA</span>
                          </span>
                        ) : (
                          <span className="font-mono font-medium text-slate-800">{log.action}</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-slate-800">{log.details}</td>

                      <td className="py-3 px-3.5 text-slate-600">
                        {log.overrideReason ? (
                          <span className="font-semibold text-rose-800 block text-[11px]">
                            Motivo: "{log.overrideReason}"
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'params' && (
        /* SYSTEM PARAMETERS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Limites Operacionais do CD Move Log
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800 block">Capacidade Máxima do Pátio</span>
                  <span className="text-[11px] text-slate-500">Limite simultâneo de veículos em permanência</span>
                </div>
                <span className="font-mono text-base font-bold text-slate-900">
                  {config.maxYardCapacity} veículos
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800 block">Total de Docas Físicas</span>
                  <span className="text-[11px] text-slate-500">Docas 01 a 14 com controle anti-conflito</span>
                </div>
                <span className="font-mono text-base font-bold text-slate-900">
                  {config.totalDocks} docas
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800 block">Meta Diária de Recebimento</span>
                  <span className="text-[11px] text-slate-500">Distribuição uniforme nos dois turnos</span>
                </div>
                <span className="font-mono text-base font-bold text-slate-900">
                  {config.dailyTruckTarget} caminhões/dia
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Grade Horária & Intervalos Obrigatórios
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800 block">Turno 1 (Manhã)</span>
                  <span className="text-[11px] text-slate-500">Janela matutina de recebimento</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {config.shift1Start} às {config.shift1End}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900">
                <div>
                  <span className="font-bold block">Intervalo de Almoço (Bloqueado)</span>
                  <span className="text-[11px] opacity-80">Agendamentos bloqueados por regra contratual</span>
                </div>
                <span className="font-mono font-bold">
                  {config.lunchBlockStart} às {config.lunchBlockEnd}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800 block">Turno 2 (Tarde)</span>
                  <span className="text-[11px] text-slate-500">Janela vespertina de recebimento</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {config.shift2Start} às {config.shift2End}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  if (confirm('Deseja restaurar todos os dados e agendamentos de demonstração da Move Log?')) {
                    resetToInitialDemo();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restaurar Base de Demonstração (32 Caminhões)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profiles' && (
        /* PROFILES SIMULATED AUTH */
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            O Move Log TMS possui controle baseado em perfis (RBAC). Alterne o usuário ativo abaixo para testar permissões dinâmicas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProfiles.map((p) => {
              const isCurrent = activeProfile.role === p.role;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-slate-900 bg-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{p.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{p.roleLabel}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">{p.email}</p>

                    <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                      <p>
                        <strong>Permissões:</strong>{' '}
                        {p.role === 'ADMIN'
                          ? 'Acesso irrestrito a todos os módulos e parâmetros'
                          : p.role === 'GESTOR_LOGISTICO'
                          ? 'Agendamentos, Otimização, Liberação de Sobrecarga e Relatórios'
                          : p.role === 'OPERADOR_PATIO'
                          ? 'Portaria, Check-in, Pátio e Fila de Espera'
                          : p.role === 'OPERADOR_DOCA'
                          ? 'Gestão de Docas, Início, Pausa e Conclusão de Descargas'
                          : 'Apenas visualização de relatórios e painéis'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => switchProfile(p.role)}
                      disabled={isCurrent}
                      className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCurrent ? 'Perfil em Uso' : 'Assumir este Perfil'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        /* MULTI-TENANT ARCHITECTURE */
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Estrutura Multi-Tenant (Move Log Matriz & Filiais)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            O Move Log TMS foi desenvolvido com arquitetura isolada por empresa (Multi-Tenant). Na versão atual, opera exclusivamente para o Centro de Distribuição Move Log Louveira/Cajamar.
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Razão Social:</span>
              <span className="font-semibold text-slate-800">{company.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CNPJ:</span>
              <span className="font-mono font-semibold text-slate-800">{company.cnpj}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Centro de Distribuição:</span>
              <span className="font-semibold text-slate-800">{company.distributionCenterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Localização:</span>
              <span className="text-slate-800">{company.city} - {company.state}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
