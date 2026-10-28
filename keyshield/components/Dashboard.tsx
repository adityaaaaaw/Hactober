'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Cpu,
  Lock,
  RefreshCw,
  Terminal,
  History,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  Plus,
  User,
  ArrowRight,
} from 'lucide-react';
import { StatsCards } from '@/components/StatsCards';
import { UploadPanel } from '@/components/UploadPanel';
import { FindingsTable } from '@/components/FindingsTable';
import { FindingDetail } from '@/components/FindingDetail';
import { ScanHistory } from '@/components/ScanHistory';
import { AmbientSparkles } from '@/components/AmbientSparkles';
import type { Finding, Scan, DashboardStats, ScanResponse, RemediationStatus } from '@/types';

type ActiveTab = 'overview' | 'scanner' | 'findings' | 'history';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFindings: 0,
    criticalRisks: 0,
    resolvedFindings: 0,
    totalScans: 0,
    openFindings: 0,
  });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  // Fetch initial data & verify real Gemma 4 / Ollama connectivity
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [findingsRes, historyRes, statusRes] = await Promise.all([
        fetch('/api/findings'),
        fetch('/api/history'),
        fetch('/api/status'),
      ]);

      if (findingsRes.ok) {
        const data = await findingsRes.json();
        setFindings(data.findings || []);
        if (data.stats) setStats(data.stats);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setScans(data.scans || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setOllamaOnline(Boolean(statusData.ollamaOnline));
      } else {
        setOllamaOnline(false);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setOllamaOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [findingsRes, historyRes, statusRes] = await Promise.all([
          fetch('/api/findings'),
          fetch('/api/history'),
          fetch('/api/status'),
        ]);

        if (ignore) return;

        if (findingsRes.ok) {
          const data = await findingsRes.json();
          setFindings(data.findings || []);
          if (data.stats) setStats(data.stats);
        }

        if (historyRes.ok) {
          const data = await historyRes.json();
          setScans(data.scans || []);
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setOllamaOnline(Boolean(statusData.ollamaOnline));
        } else {
          setOllamaOnline(false);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        if (!ignore) setOllamaOnline(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle new scan completion
  const handleScanComplete = (result: ScanResponse) => {
    setScans((prev) => [result.scan, ...prev]);
    setFindings((prev) => [...result.findings, ...prev]);

    // Recalculate stats
    fetchData();

    if (result.findings.length > 0) {
      setSelectedFinding(result.findings[0]);
    }
  };

  // Handle updating finding status (e.g. resolve / reopen)
  const handleUpdateStatus = async (findingId: number, newStatus: RemediationStatus) => {
    try {
      const res = await fetch(`/api/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setFindings((prev) =>
          prev.map((f) => (f.id === findingId ? data.finding : f))
        );
        if (selectedFinding?.id === findingId) {
          setSelectedFinding(data.finding);
        }
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update finding status:', err);
    }
  };

  const scrollToScanner = () => {
    setActiveTab('overview');
    const el = document.getElementById('scanner-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'overview' as ActiveTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner' as ActiveTab, label: 'Scanner', icon: Terminal },
    { id: 'findings' as ActiveTab, label: 'Findings', icon: ShieldAlert, count: stats.openFindings },
    { id: 'history' as ActiveTab, label: 'Audit History', icon: History },
  ];

  return (
    <div className="relative min-h-screen bg-[#A78BFA] text-slate-900 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/25 selection:text-indigo-950">
      {/* ─── AMBIENT SPARKLES & LIGHT SPECK CANVAS ───────────────────── */}
      <AmbientSparkles />

      {/* ─── 1. FLOATING TOP NAVIGATION BAR ─────────────────────────── */}
      <div className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto anim-fade-in-up">
        <header className="w-full rounded-full border border-slate-200/80 bg-white shadow-md py-2.5 px-4 sm:px-6 flex items-center justify-between gap-4 transition-all">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-black shadow-sm shadow-indigo-600/30 transition-transform hover:scale-105">
              <Shield className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-slate-900">KeyShield</span>
              <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/60">
                PRO
              </span>
            </div>
          </div>

          {/* Center: Horizontal Floating Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-slate-100/80 border border-slate-200/50 shadow-2xs">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn-pill flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Real Gemma 4 Verified Status, Sync DB & Profile Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Gemma 4 REAL Verified Status Pill */}
            {ollamaOnline === true ? (
              <div
                title="Ollama connection verified: Model gemma4:e4b online"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold shadow-2xs transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                <span>Gemma 4</span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold">
                  gemma4:e4b
                </span>
              </div>
            ) : ollamaOnline === false ? (
              <div
                title="Ollama daemon is offline (run 'ollama serve')"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold shadow-2xs transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <Cpu className="h-3.5 w-3.5 text-amber-600" />
                <span>Gemma 4</span>
                <span className="text-[10px] font-mono text-amber-700 font-bold">
                  Offline
                </span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                <Cpu className="h-3.5 w-3.5 text-slate-400" />
                <span>Gemma 4</span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">Checking...</span>
              </div>
            )}

            {/* Sync DB button */}
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              title="Sync Database & Audit Logs"
              className="btn-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* User Profile Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-2xs transition-transform hover:scale-105">
              <User className="h-4 w-4" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-pill p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg md:hidden anim-fade-in-up">
            <nav className="space-y-1">
              {navLinks.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-indigo-600" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* ─── 2. MAIN DASHBOARD CONTENT CONTAINER (Centered, Max-W: 1440px) ─── */}
      <main className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1 space-y-8">
        {/* Header Hero Greeting & Action Section */}
        <div className="anim-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Security Overview
            </h1>
            <p className="text-sm text-slate-800 font-medium mt-1">
              Real-time secret detection, automated masking, and local Gemma 4 AI response.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToScanner}
              className="btn-pill btn-shimmer group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-950/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>Scan New Code</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Security Assurance Banner */}
        <div className="interactive-card anim-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-sm text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700">
              <strong className="text-slate-900 font-semibold">Zero Execution Sandbox:</strong> Uploaded and pasted code is treated as untrusted text and parsed via static regex automata. No code is ever executed or sent to public cloud LLMs.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shrink-0">
            Local SQLite • Offline Ready
          </span>
        </div>

        {/* 1. Horizontal Responsive Row of 4 KPI Metric Cards */}
        <StatsCards stats={stats} />

        {/* 2. Prominent, Spacious Scanner Console Card */}
        {(activeTab === 'overview' || activeTab === 'scanner') && (
          <div className="anim-fade-in-up anim-delay-2">
            <UploadPanel onScanComplete={handleScanComplete} />
          </div>
        )}

        {/* 3. Detailed Finding Inspection Drawer */}
        {selectedFinding && (
          <div className="anim-fade-in-up">
            <FindingDetail
              finding={selectedFinding}
              onClose={() => setSelectedFinding(null)}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {/* 4. Full-Width Findings Table */}
        {(activeTab === 'overview' || activeTab === 'findings') && (
          <div className="anim-fade-in-up anim-delay-3">
            <FindingsTable
              findings={findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              onUpdateStatus={handleUpdateStatus}
              selectedFindingId={selectedFinding?.id}
            />
          </div>
        )}

        {/* 5. Audit & Scan History Section */}
        {(activeTab === 'overview' || activeTab === 'history') && (
          <div className="anim-fade-in-up anim-delay-4">
            <ScanHistory
              scans={scans}
              onSelectScan={(s) => {
                const first = findings.find((f) => f.scanId === s.id);
                if (first) {
                  setSelectedFinding(first);
                  const el = document.getElementById('findings-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>
        )}
      </main>

      {/* ─── 3. MODERN CLEAN FOOTER ─────────────────────────────────── */}
      <footer className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-8 pt-4 max-w-[1440px] mx-auto mt-auto anim-fade-in-up">
        <div className="w-full rounded-[24px] border border-slate-200/80 bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span className="font-bold text-slate-800">KeyShield Security Platform</span>
            <span className="hidden md:inline">— AI-Powered Secret Leak Detection & Response</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px] font-medium">
            <span>Next.js 16 • React 19</span>
            <span>•</span>
            <span>SQLite Embedded</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Gemma 4 via Ollama</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
