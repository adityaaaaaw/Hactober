import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, History, ArrowUpRight } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const remediationRate =
    stats.totalFindings > 0
      ? Math.round((stats.resolvedFindings / stats.totalFindings) * 100)
      : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Findings */}
      <div className="interactive-card anim-fade-in-up anim-delay-1 flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Findings
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {stats.totalFindings}
              </span>
              <span className="text-xs text-slate-400">detected</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 transition-transform group-hover:scale-105">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Across all scans</span>
          <span className="font-semibold text-slate-700">{stats.openFindings} active</span>
        </div>
      </div>

      {/* 2. Critical Risks */}
      <div className="interactive-card anim-fade-in-up anim-delay-2 flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Critical Risks
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-rose-600 font-mono">
                {stats.criticalRisks}
              </span>
              <span className="text-xs text-rose-400 font-medium">immediate action</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 transition-transform group-hover:scale-105">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-rose-600">
          <span>High impact leak</span>
          <span className="font-semibold flex items-center gap-0.5">
            Requires rotation
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* 3. Resolved Findings */}
      <div className="interactive-card anim-fade-in-up anim-delay-3 flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Resolved Findings
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-700 font-mono">
                {stats.resolvedFindings}
              </span>
              <span className="text-xs text-emerald-500 font-medium">remediated</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform group-hover:scale-105">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-emerald-700">
          <span>Remediation rate</span>
          <span className="font-bold text-emerald-700">
            {remediationRate}% resolved
          </span>
        </div>
      </div>

      {/* 4. Scans Executed */}
      <div className="interactive-card anim-fade-in-up anim-delay-4 flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Scans Logged
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {stats.totalScans}
              </span>
              <span className="text-xs text-slate-400">audit runs</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 border border-slate-200/60 transition-transform group-hover:scale-105">
            <History className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Engine status</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            16 Automata Active
          </span>
        </div>
      </div>
    </div>
  );
};
