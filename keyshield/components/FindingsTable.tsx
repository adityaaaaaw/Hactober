import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertCircle,
  FileCode,
  CheckCircle,
  XCircle,
  Sparkles,
  Filter,
  Search,
} from 'lucide-react';
import type { Finding, Severity, RemediationStatus } from '@/types';

interface FindingsTableProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onUpdateStatus: (findingId: number, newStatus: RemediationStatus) => void;
  selectedFindingId?: number;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  onSelectFinding,
  onUpdateStatus,
  selectedFindingId,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.ruleName.toLowerCase().includes(q);
      const matchFile = f.filePath.toLowerCase().includes(q);
      const matchRule = f.ruleId.toLowerCase().includes(q);
      if (!matchName && !matchFile && !matchRule) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: RemediationStatus) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs transition-all duration-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'false_positive':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-all duration-200">
            <XCircle className="h-3.5 w-3.5" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs transition-all duration-200">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            Open Alert
          </span>
        );
    }
  };

  return (
    <div id="findings-section" className="interactive-card rounded-[28px] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* Table Header controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Detected Vulnerabilities & Secret Leaks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredFindings.length} of {findings.length} findings
            </p>
          </div>
        </div>

        {/* Rounded Controls: search and filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search findings, files, keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 w-52 sm:w-64 transition-all shadow-2xs"
            />
          </div>

          {/* Severity */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Secret Rule</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Masked Signature</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                  No matching secrets detected for the selected criteria.
                </td>
              </tr>
            ) : (
              filteredFindings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors duration-150 ${
                    selectedFindingId === finding.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 text-xs">{finding.ruleName}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{finding.ruleId}</div>
                  </td>
                  <td className="py-4 px-4">{getSeverityBadge(finding.severity)}</td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 inline-block font-semibold">
                      {finding.maskedValue}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                      <FileCode className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{finding.filePath}</span>
                      <span className="text-indigo-600 font-bold">:{finding.lineNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getStatusBadge(finding.status)}</td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {finding.status !== 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(finding.id, 'resolved')}
                          className="btn-pill px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-2xs cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(finding.id, 'open')}
                          className="btn-pill px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold shadow-2xs cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectFinding(finding)}
                        className="btn-pill group px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-indigo-600 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
                        <span>AI Analysis</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
