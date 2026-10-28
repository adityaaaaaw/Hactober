'use client';

import React, { useState } from 'react';
import { Upload, FileCode, Play, Terminal, Check, AlertCircle, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ScanResponse } from '@/types';

interface UploadPanelProps {
  onScanComplete: (result: ScanResponse) => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onScanComplete }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pastedCode, setPastedCode] = useState<string>('');
  const [files, setFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Quick testing presets for hackathon demos
  const loadDemoSample = (type: 'aws' | 'multi' | 'clean') => {
    setError(null);
    setSuccessInfo(null);
    if (type === 'aws') {
      setPastedCode(`// Production AWS deployment worker
const AWS = require('aws-sdk');

const credentials = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-west-2'
};

const s3 = new AWS.S3(credentials);
console.log("Bucket initialized successfully");
`);
    } else if (type === 'multi') {
      setPastedCode(`import stripe from 'stripe';

// API Client keys
const STRIPE_SECRET = 'sk_test_51MockTestKeyForScannerVerificationOnly99';
const GITHUB_TOKEN = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
const DB_URL = "postgres://admin:Sup3rSecr3tPassword!@db.internal:5432/production";

export function handleWebhook(payload) {
  // Slack alert channel
  const hook = "https://hooks.slack.com/services/T00MOCKSAMPLE/B00TESTSAMPLE/MOCKWEBHOOKTESTNOTPRODUCTION";
  console.log("Sending payload to hook");
}
`);
    } else {
      setPastedCode(`// Safe code using environment variables
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  awsKey: process.env.AWS_ACCESS_KEY_ID,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
  dbUrl: process.env.DATABASE_URL,
};

export function ping() {
  return "System operational, all secrets loaded from secure vault.";
}
`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessInfo(null);
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    if (uploadedFiles.length > 20) {
      setError('You can upload a maximum of 20 files at once.');
      return;
    }

    const loadedFiles: Array<{ name: string; content: string }> = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];

      if (file.size > 1024 * 1024) {
        setError(`File ${file.name} is larger than the 1 MB limit.`);
        return;
      }

      try {
        const text = await file.text();
        loadedFiles.push({ name: file.name, content: text });
      } catch {
        setError(`Failed to read file ${file.name}.`);
        return;
      }
    }

    setFiles(loadedFiles);
  };

  const handleRunScan = async () => {
    if (isScanning) return; // Prevent duplicate concurrent submissions
    setError(null);
    setSuccessInfo(null);

    if (activeTab === 'paste' && !pastedCode.trim()) {
      setError('Please paste source code to scan, or select a demo sample.');
      return;
    }

    if (activeTab === 'upload' && files.length === 0) {
      setError('Please upload at least one file to scan.');
      return;
    }

    setIsScanning(true);

    try {
      const payload =
        activeTab === 'paste'
          ? { pastedCode: pastedCode.trim(), scanName: 'Manual Paste Scan' }
          : { files, scanName: `Upload — ${files.map((f) => f.name).join(', ').slice(0, 40)}` };

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Scan request failed.');
      }

      const scanResult: ScanResponse = await res.json();
      onScanComplete(scanResult);

      const count = scanResult.findings?.length || 0;
      setSuccessInfo(
        count > 0
          ? `Scan complete: ${count} secret finding${count > 1 ? 's' : ''} detected & masked.`
          : 'Scan complete: No secret leaks detected — safe code!'
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to complete scan.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div id="scanner-section" className="interactive-card rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-sm">
      {/* Header with rounded segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Scanner Console
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic regex AST detectors • Zero code execution sandbox
            </p>
          </div>
        </div>

        {/* Rounded Segmented Control */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/60 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`btn-pill flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
              activeTab === 'paste'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-indigo-600" />
            Paste Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`btn-pill flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-indigo-600" />
            Upload Files
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'paste' ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-600">
                Source Code or Configuration Snippet
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => loadDemoSample('aws')}
                  className="btn-pill px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-2xs cursor-pointer"
                >
                  AWS Key
                </button>
                <button
                  type="button"
                  onClick={() => loadDemoSample('multi')}
                  className="btn-pill px-3 py-1 rounded-full text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 shadow-2xs cursor-pointer"
                >
                  Multi-Secret
                </button>
                <button
                  type="button"
                  onClick={() => loadDemoSample('clean')}
                  className="btn-pill px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 shadow-2xs cursor-pointer"
                >
                  Clean Code
                </button>
              </div>
            </div>

            {/* Editor Container with Scanner Sweep Animation */}
            <div className="relative rounded-[20px] overflow-hidden">
              {isScanning && <div className="anim-sweep-line z-20" />}
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                disabled={isScanning}
                placeholder="// Paste source code, configuration files, .env snippets, or PEM certificates here..."
                rows={9}
                className={`w-full rounded-[20px] border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed shadow-2xs ${
                  isScanning ? 'opacity-80 bg-slate-50/50' : ''
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="relative rounded-[22px] border-2 border-dashed border-slate-200 bg-white p-9 text-center hover:border-indigo-400 transition shadow-2xs overflow-hidden">
            {isScanning && <div className="anim-sweep-line z-20" />}
            <input
              type="file"
              multiple
              id="file-upload"
              disabled={isScanning}
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center space-y-3 ${
                isScanning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm transition-transform hover:scale-105">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drop source files (.js, .ts, .py, .env, .json, .tf, .yaml)
              </p>
              <p className="text-xs text-slate-500 max-w-md">
                Up to 20 files, maximum 1 MB per file. Code is scanned entirely in memory and never executed.
              </p>
            </label>

            {files.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200/80 text-left">
                <p className="text-xs font-bold text-slate-700 mb-2.5">
                  Selected Files ({files.length}):
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-xs font-mono text-emerald-800 border border-emerald-200 font-semibold"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 anim-fade-in-up flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Success Toast Banner with smooth pop */}
        {successInfo && (
          <div className="mt-4 anim-success-pop flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Bottom bar with Analyze button */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Candidate secrets are masked before rendering in UI or AI prompts</span>
          </div>

          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="btn-pill btn-shimmer group flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 text-xs font-bold shadow-md shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isScanning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Scanning Repository...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>Analyze for Leaks</span>
                <Sparkles className="h-3 w-3 text-indigo-200 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
