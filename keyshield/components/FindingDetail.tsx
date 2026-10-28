import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  FileCode,
  CornerDownRight,
  XCircle,
  HelpCircle,
  ListChecks,
  Code2,
  ExternalLink,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import type { Finding, RemediationStatus } from '@/types';
import { generateRemediationChecklist, generateSafePatch } from '@/lib/remediation';

interface FindingDetailProps {
  finding: Finding | null;
  onClose: () => void;
  onUpdateStatus: (findingId: number, newStatus: RemediationStatus) => void;
}

export const FindingDetail: React.FC<FindingDetailProps> = ({
  finding,
  onClose,
  onUpdateStatus,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [localExplanation, setLocalExplanation] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedDiff, setCopiedDiff] = useState<boolean>(false);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  if (!finding) return null;

  // Use the local explanation generated during this session, or the finding's cached explanation
  const displayExplanation = localExplanation ?? finding.aiExplanation ?? null;

  // Generate remediation checklist and safe patch
  const checklist = generateRemediationChecklist(finding);
  const patch = generateSafePatch(finding);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  const handleExplainWithGemma = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id }),
      });

      const data = await res.json();
      setLocalExplanation(data.explanation);
      setOllamaAvailable(data.ollamaAvailable);
    } catch {
      setLocalExplanation('Failed to reach local Ollama instance at http://127.0.0.1:11434.');
      setOllamaAvailable(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(finding.lineContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDiff = () => {
    navigator.clipboard.writeText(patch.diff);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(patch.envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-md transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {finding.ruleName}
              </h3>
              <span className="text-xs font-mono text-slate-500">({finding.ruleId})</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">
                {finding.severity}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {finding.filePath} : Line {finding.lineNumber}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Code Snippet Preview */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-semibold">
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <FileCode className="h-4 w-4 text-indigo-600" />
            Detected Line in Source Code
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-mono transition cursor-pointer font-bold"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedCode ? 'Copied' : 'Copy line'}
          </button>
        </div>

        <div className="relative rounded-[20px] bg-white p-4.5 border border-slate-200 font-mono text-xs text-slate-900 overflow-x-auto leading-relaxed shadow-2xs">
          <div className="flex gap-4">
            <span className="text-slate-400 select-none font-bold">{finding.lineNumber}</span>
            <span className="text-rose-600 font-semibold">{finding.lineContent}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <CornerDownRight className="h-3.5 w-3.5 text-indigo-600" />
          <span>Masked Signature:</span>
          <span className="font-mono text-slate-800 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200 font-bold">
            {finding.maskedValue}
          </span>
          <span className="text-[11px] text-slate-400 italic">(Raw secrets are never exposed to UI or AI)</span>
        </div>
      </div>

      {/* Recommended Rule Remediation (Tomato Alert) */}
      <div className="mt-6 rounded-[22px] bg-rose-50/70 p-4.5 border border-rose-100">
        <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2 mb-1.5">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          Immediate Remediation Guidance
        </h4>
        <p className="text-xs text-rose-900 leading-relaxed font-medium">{finding.remediation}</p>
      </div>

      {/* ─── PHASE 3 FEATURE: STEP-BY-STEP REMEDIATION CHECKLIST ─── */}
      <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Remediation Checklist
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {completedCount} of {checklist.length} completed
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">Track and verify rotation tasks before marking this leak resolved.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {checklist.map((step) => {
            const isDone = Boolean(completedSteps[step.id]);
            return (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`flex items-start gap-3 p-3.5 rounded-[18px] border transition cursor-pointer ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200/70 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleStep(step.id)}
                  className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {step.title}
                    </span>
                    {step.actionUrl && (
                      <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Dashboard <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className={`mt-0.5 ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
                  {step.command && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-900 text-slate-100 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                      <Terminal className="h-3.5 w-3.5 text-slate-400" />
                      <span>{step.command}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── PHASE 3 FEATURE: SAFE CODE PATCH & DIFF GENERATOR ─── */}
      <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Safe Patch Proposal
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                  Non-Destructive
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">Replaces hardcoded secret literal with environment variable reference.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDiff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              {copiedDiff ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedDiff ? 'Copied' : 'Copy Git Diff'}
            </button>
            <button
              type="button"
              onClick={handleCopyEnv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
            >
              {copiedEnv ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedEnv ? 'Copied' : 'Copy .env'}
            </button>
          </div>
        </div>

        {/* Git-style diff display */}
        <div className="rounded-[18px] bg-slate-900 p-4 font-mono text-xs overflow-x-auto text-slate-100 leading-relaxed">
          <div className="text-slate-500 text-[11px] mb-1.5 select-none font-bold">--- a/{patch.targetFile}</div>
          <div className="text-slate-500 text-[11px] mb-2 select-none font-bold">+++ b/{patch.targetFile}</div>
          <div className="text-rose-400 bg-rose-950/40 px-2 py-1 rounded-md mb-1">
            - {patch.originalCode}
          </div>
          <div className="text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-md">
            + {patch.patchedCode}
          </div>
        </div>

        {/* .env example snippet */}
        <div className="mt-3 rounded-[18px] bg-slate-50 p-3.5 border border-slate-200 font-mono text-[11px] text-slate-700">
          <span className="font-bold text-slate-900 block mb-1">Environment Variable Configuration:</span>
          <pre className="whitespace-pre-wrap">{patch.envSnippet}</pre>
        </div>

        {/* Non-destructive guarantee notice */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{patch.safetyGuarantee}</span>
        </div>
      </div>

      {/* Gemma 4 AI Analysis Section (Live inference from Ollama) */}
      <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Gemma 4 Threat & Remediation Assistant
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                  gemma4:e4b
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">Live local LLM inference via Ollama (http://127.0.0.1:11434)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExplainWithGemma}
            disabled={isGenerating}
            className="btn-pill btn-shimmer group flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-sm shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Analyzing Risk...</span>
              </div>
            ) : displayExplanation ? (
              <>
                <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
                <span>Regenerate with Gemma 4</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
                <span>Ask Gemma 4</span>
              </>
            )}
          </button>
        </div>

        {displayExplanation ? (
          <div className="rounded-[18px] bg-white p-5 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans shadow-sm">
            {displayExplanation}
            {ollamaAvailable === false && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Tip: Run <code>ollama serve</code> and ensure <code>gemma4:e4b</code> is running.</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Click &quot;Ask Gemma 4&quot; to generate an in-depth security analysis, threat impact, and custom code refactoring steps using the local Gemma 4 model.
          </p>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="flex items-center gap-3">
          {finding.status !== 'resolved' ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(finding.id, 'resolved')}
              className="btn-pill flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Resolved
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateStatus(finding.id, 'open')}
              className="btn-pill flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Reopen Finding
            </button>
          )}

          {finding.status !== 'false_positive' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(finding.id, 'false_positive')}
              className="btn-pill flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Mark False Positive
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn-pill text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
