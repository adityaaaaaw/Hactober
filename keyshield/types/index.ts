// KeyShield — shared types

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type RemediationStatus = 'open' | 'resolved' | 'false_positive';

export interface SecretRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: Severity;
  remediation: string;
}

export interface RawFinding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  /** The raw matched value — never logged or shown in full */
  rawValue: string;
  /** Masked representation safe to display */
  maskedValue: string;
  lineNumber: number;
  lineContent: string; // sanitised line with secret masked
  filePath: string;
  remediation: string;
}

export interface Finding {
  id: number;
  scanId: number;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  maskedValue: string;
  lineNumber: number;
  lineContent: string;
  filePath: string;
  remediation: string;
  status: RemediationStatus;
  aiExplanation?: string;
  createdAt: string;
}

export interface Scan {
  id: number;
  name: string;
  source: 'upload' | 'paste';
  filesScanned: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalFindings: number;
  criticalRisks: number;
  resolvedFindings: number;
  totalScans: number;
  openFindings: number;
}

export interface ScanRequest {
  files?: Array<{ name: string; content: string }>;
  pastedCode?: string;
  scanName?: string;
}

export interface ScanResponse {
  scan: Scan;
  findings: Finding[];
}

export interface ExplainRequest {
  findingId: number;
}

export interface ExplainResponse {
  explanation: string;
  ollamaAvailable: boolean;
}
