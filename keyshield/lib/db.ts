import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Scan, Finding, DashboardStats } from '@/types';

// ─── DB path (next to the project, outside public/) ───────────────────────
const DB_DIR = process.env.DB_DIR ?? path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'keyshield.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure directory exists
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  migrate(_db);
  seedDemoData(_db);

  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────
function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      source       TEXT    NOT NULL DEFAULT 'paste',
      files_scanned INTEGER NOT NULL DEFAULT 1,
      total_findings INTEGER NOT NULL DEFAULT 0,
      critical_count INTEGER NOT NULL DEFAULT 0,
      high_count    INTEGER NOT NULL DEFAULT 0,
      medium_count  INTEGER NOT NULL DEFAULT 0,
      low_count     INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS findings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id        INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      rule_id        TEXT    NOT NULL,
      rule_name      TEXT    NOT NULL,
      severity       TEXT    NOT NULL,
      masked_value   TEXT    NOT NULL,
      line_number    INTEGER NOT NULL DEFAULT 0,
      line_content   TEXT    NOT NULL DEFAULT '',
      file_path      TEXT    NOT NULL DEFAULT '',
      remediation    TEXT    NOT NULL DEFAULT '',
      status         TEXT    NOT NULL DEFAULT 'open',
      ai_explanation TEXT,
      created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_findings_scan   ON findings(scan_id);
    CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
    CREATE INDEX IF NOT EXISTS idx_findings_sev    ON findings(severity);
  `);
}

// ─── Typed query helpers ───────────────────────────────────────────────────

export function insertScan(
  name: string,
  source: 'upload' | 'paste',
  filesScanned: number,
): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO scans (name, source, files_scanned) VALUES (?, ?, ?)`,
    )
    .run(name, source, filesScanned);
  return result.lastInsertRowid as number;
}

export function updateScanCounts(scanId: number, counts: {
  total: number; critical: number; high: number; medium: number; low: number;
}): void {
  getDb()
    .prepare(
      `UPDATE scans SET
        total_findings = ?,
        critical_count = ?,
        high_count     = ?,
        medium_count   = ?,
        low_count      = ?
       WHERE id = ?`,
    )
    .run(counts.total, counts.critical, counts.high, counts.medium, counts.low, scanId);
}

export function insertFinding(f: {
  scanId: number;
  ruleId: string;
  ruleName: string;
  severity: string;
  maskedValue: string;
  lineNumber: number;
  lineContent: string;
  filePath: string;
  remediation: string;
}): number {
  const result = getDb()
    .prepare(
      `INSERT INTO findings
        (scan_id, rule_id, rule_name, severity, masked_value,
         line_number, line_content, file_path, remediation)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      f.scanId, f.ruleId, f.ruleName, f.severity, f.maskedValue,
      f.lineNumber, f.lineContent, f.filePath, f.remediation,
    );
  return result.lastInsertRowid as number;
}

// ─── Row → domain mappers ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToScan(r: any): Scan {
  return {
    id: r.id,
    name: r.name,
    source: r.source,
    filesScanned: r.files_scanned,
    totalFindings: r.total_findings,
    criticalCount: r.critical_count,
    highCount: r.high_count,
    mediumCount: r.medium_count,
    lowCount: r.low_count,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFinding(r: any): Finding {
  return {
    id: r.id,
    scanId: r.scan_id,
    ruleId: r.rule_id,
    ruleName: r.rule_name,
    severity: r.severity,
    maskedValue: r.masked_value,
    lineNumber: r.line_number,
    lineContent: r.line_content,
    filePath: r.file_path,
    remediation: r.remediation,
    status: r.status,
    aiExplanation: r.ai_explanation ?? undefined,
    createdAt: r.created_at,
  };
}

export function getScans(limit = 20): Scan[] {
  return (getDb()
    .prepare(`SELECT * FROM scans ORDER BY id DESC LIMIT ?`)
    .all(limit) as object[]).map(rowToScan);
}

export function getScanById(id: number): Scan | undefined {
  const row = getDb().prepare(`SELECT * FROM scans WHERE id = ?`).get(id);
  return row ? rowToScan(row) : undefined;
}

export function getFindingsByScan(scanId: number): Finding[] {
  return (getDb()
    .prepare(`SELECT * FROM findings WHERE scan_id = ? ORDER BY severity DESC, id ASC`)
    .all(scanId) as object[]).map(rowToFinding);
}

export function getAllFindings(limit = 200): Finding[] {
  return (getDb()
    .prepare(
      `SELECT * FROM findings ORDER BY
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        id DESC LIMIT ?`,
    )
    .all(limit) as object[]).map(rowToFinding);
}

export function getFindingById(id: number): Finding | undefined {
  const row = getDb().prepare(`SELECT * FROM findings WHERE id = ?`).get(id);
  return row ? rowToFinding(row) : undefined;
}

export function updateFindingStatus(id: number, status: string): boolean {
  const result = getDb()
    .prepare(`UPDATE findings SET status = ? WHERE id = ?`)
    .run(status, id);
  return result.changes > 0;
}

export function updateFindingExplanation(id: number, explanation: string): void {
  getDb()
    .prepare(`UPDATE findings SET ai_explanation = ? WHERE id = ?`)
    .run(explanation, id);
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN status = 'resolved'   THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'open'       THEN 1 ELSE 0 END) as open_count
    FROM findings
  `).get() as { total: number; critical: number; resolved: number; open_count: number };

  const scanCount = (db.prepare(`SELECT COUNT(*) as c FROM scans`).get() as { c: number }).c;

  return {
    totalFindings: totals.total ?? 0,
    criticalRisks: totals.critical ?? 0,
    resolvedFindings: totals.resolved ?? 0,
    totalScans: scanCount ?? 0,
    openFindings: totals.open_count ?? 0,
  };
}

// ─── Demo seed data (fake credentials — never real) ───────────────────────
function seedDemoData(db: Database.Database): void {
  const existing = (db.prepare(`SELECT COUNT(*) as c FROM scans`).get() as { c: number }).c;
  if (existing > 0) return; // already seeded

  // Insert 3 demo scans with fake findings
  const demoScans: Array<{
    name: string; source: 'upload' | 'paste'; files: number;
    findings: Array<{
      ruleId: string; ruleName: string; severity: string;
      maskedValue: string; lineNumber: number; lineContent: string;
      filePath: string; remediation: string; status: string;
    }>;
  }> = [
    {
      name: 'Demo — backend/config.js',
      source: 'upload',
      files: 3,
      findings: [
        {
          ruleId: 'aws-access-key',
          ruleName: 'AWS Access Key ID',
          severity: 'critical',
          maskedValue: 'AKIA••••••••••••XXXX',
          lineNumber: 14,
          lineContent: "const AWS_KEY = 'AKIA••••••••••••XXXX';",
          filePath: 'backend/config.js',
          remediation: 'Immediately rotate the AWS key in IAM, revoke the old one, and use AWS Secrets Manager or environment variables instead of hardcoding.',
          status: 'open',
        },
        {
          ruleId: 'stripe-secret',
          ruleName: 'Stripe Secret Key',
          severity: 'critical',
          maskedValue: 'sk_l••••••••••••test',
          lineNumber: 22,
          lineContent: "STRIPE_SECRET = 'sk_l••••••••••••test'",
          filePath: 'backend/payments.js',
          remediation: 'Roll the key at dashboard.stripe.com/apikeys. Never commit Stripe keys; use environment variables.',
          status: 'open',
        },
        {
          ruleId: 'generic-password',
          ruleName: 'Hardcoded Password',
          severity: 'high',
          maskedValue: 'sup••••••••••ord!',
          lineNumber: 8,
          lineContent: "db_password = 'sup••••••••••ord!'",
          filePath: 'backend/database.js',
          remediation: 'Remove the hardcoded password. Use a secrets manager or environment variables at runtime.',
          status: 'resolved',
        },
        {
          ruleId: 'github-pat',
          ruleName: 'GitHub Personal Access Token',
          severity: 'critical',
          maskedValue: 'ghp_••••••••••••••••••••••••••••••WXYZ',
          lineNumber: 5,
          lineContent: "const token = 'ghp_••••••••••••••••••••••••••••••WXYZ'",
          filePath: 'scripts/deploy.sh',
          remediation: 'Revoke the token at github.com/settings/tokens. Use GitHub Actions secrets or a secret manager.',
          status: 'open',
        },
      ],
    },
    {
      name: 'Demo — frontend/.env leak',
      source: 'paste',
      files: 1,
      findings: [
        {
          ruleId: 'google-api-key',
          ruleName: 'Google API Key',
          severity: 'high',
          maskedValue: 'AIza••••••••••••••••••••••••••••ABCD',
          lineNumber: 3,
          lineContent: "NEXT_PUBLIC_MAPS_KEY='AIza••••••••••••••••••••••••••••ABCD'",
          filePath: 'frontend/.env',
          remediation: 'Restrict or regenerate the key in GCP Console. Apply API restrictions and use Secret Manager.',
          status: 'open',
        },
        {
          ruleId: 'slack-token',
          ruleName: 'Slack API Token',
          severity: 'high',
          maskedValue: 'xoxb••••••••••••••••••••••••••••1234',
          lineNumber: 7,
          lineContent: "SLACK_TOKEN='xoxb••••••••••••••••••••••••••••1234'",
          filePath: 'frontend/.env',
          remediation: 'Revoke the token at api.slack.com/apps and re-issue. Store in environment variables.',
          status: 'false_positive',
        },
      ],
    },
    {
      name: 'Demo — infra/terraform secrets',
      source: 'upload',
      files: 5,
      findings: [
        {
          ruleId: 'rsa-private-key',
          ruleName: 'RSA Private Key',
          severity: 'critical',
          maskedValue: '-----BEGIN RSA PRIVATE KEY-----',
          lineNumber: 1,
          lineContent: '-----BEGIN RSA PRIVATE KEY-----',
          filePath: 'infra/deploy_key',
          remediation: 'Never commit private keys. Generate a new key pair and revoke the exposed one. Use a key management service.',
          status: 'open',
        },
        {
          ruleId: 'db-connection-string',
          ruleName: 'Database Connection String',
          severity: 'critical',
          maskedValue: 'postgres://adm••••••••••:5432/prod',
          lineNumber: 12,
          lineContent: 'DB_URL = "postgres://adm••••••••••:5432/prod"',
          filePath: 'infra/main.tf',
          remediation: 'Remove credentials from the connection string. Use IAM auth, password managers, or env vars.',
          status: 'open',
        },
        {
          ruleId: 'openai-key',
          ruleName: 'OpenAI API Key',
          severity: 'critical',
          maskedValue: 'sk-p••••••••••••••••••••••••••••roJx',
          lineNumber: 41,
          lineContent: "OPENAI_KEY = 'sk-p••••••••••••••••••••••••••••roJx'",
          filePath: 'infra/lambda.tf',
          remediation: 'Revoke the key at platform.openai.com/api-keys. Store it in environment variables.',
          status: 'resolved',
        },
      ],
    },
  ];

  for (const scan of demoScans) {
    const scanResult = db
      .prepare(`INSERT INTO scans (name, source, files_scanned) VALUES (?, ?, ?)`)
      .run(scan.name, scan.source, scan.files);
    const scanId = scanResult.lastInsertRowid as number;

    const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

    for (const f of scan.findings) {
      db.prepare(
        `INSERT INTO findings
          (scan_id, rule_id, rule_name, severity, masked_value,
           line_number, line_content, file_path, remediation, status)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        scanId, f.ruleId, f.ruleName, f.severity, f.maskedValue,
        f.lineNumber, f.lineContent, f.filePath, f.remediation, f.status,
      );
      counts.total++;
      if (f.severity === 'critical') counts.critical++;
      else if (f.severity === 'high') counts.high++;
      else if (f.severity === 'medium') counts.medium++;
      else counts.low++;
    }

    db.prepare(
      `UPDATE scans SET total_findings=?,critical_count=?,high_count=?,medium_count=?,low_count=? WHERE id=?`,
    ).run(counts.total, counts.critical, counts.high, counts.medium, counts.low, scanId);
  }
}
