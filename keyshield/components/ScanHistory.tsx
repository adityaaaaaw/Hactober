import React from 'react';
import { History, FileText, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Scan } from '@/types';

interface ScanHistoryProps {
  scans: Scan[];
  onSelectScan?: (scan: Scan) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ scans, onSelectScan }) => {
  return (
    <div id="history-section" className="interactive-card rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Audit & Scan History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical repository and snippet audit runs in local SQLite database
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 shadow-2xs">
          {scans.length} Scans Logged
        </span>
      </div>

      <div className="mt-5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {scans.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">No scan history recorded yet.</p>
        ) : (
          scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onSelectScan?.(scan)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-[20px] border border-slate-200/70 bg-white hover:border-indigo-300 hover:shadow-xs transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 border border-slate-200/80 group-hover:text-indigo-600 transition-colors shadow-2xs">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {scan.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span className="capitalize font-semibold text-slate-500">{scan.source}</span>
                    <span>•</span>
                    <span>{scan.filesScanned} file{scan.filesScanned > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {scan.criticalCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {scan.criticalCount} Critical
                  </span>
                )}
                {scan.totalFindings === 0 ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Clean
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200/80">
                    {scan.totalFindings} findings
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-all duration-200 group-hover:translate-x-1 hidden sm:block" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
