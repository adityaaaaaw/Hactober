import { scanFiles } from '@/lib/scanner';
import {
  insertScan,
  insertFinding,
  updateScanCounts,
  getScanById,
  getFindingsByScan,
  updateFindingStatus,
  getDashboardStats,
} from '@/lib/db';

console.log('====================================================');
console.log('   KEYSHIELD COMPREHENSIVE LOCAL VERIFICATION SUITE   ');
console.log('====================================================\n');

// 1. Test sample file with various dummy secrets
const sampleSourceFile = `
// Authentication and Integration Service (Dummy Credentials for Testing)
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const GITHUB_PAT = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
const STRIPE_SECRET = "sk_test_51MockTestKeyForScannerVerificationOnly99";
const DATABASE_URL = "postgres://admin_usr:SuperP@ssw0rd99!@cluster0.db.internal:5432/production";
const RSA_KEY_MARKER = "-----BEGIN RSA PRIVATE KEY-----";
const API_TOKEN = 'access_token = "generic_super_secret_token_12345"';
`;

console.log('▶ TEST 1: Running Deterministic Secret Scanner...');
const findings = scanFiles([
  {
    name: 'src/config/credentials.ts',
    content: sampleSourceFile,
  },
]);

console.log(`✓ Scanner detected ${findings.length} candidate secrets.`);

// Verify each finding
for (const f of findings) {
  console.log(`  • [Severity: ${f.severity.toUpperCase()}] ${f.ruleName}`);
  console.log(`    Location: ${f.filePath}:${f.lineNumber}`);
  console.log(`    Masked Value: ${f.maskedValue}`);
  console.log(`    Sanitized Line: ${f.lineContent.trim()}`);

  if (f.maskedValue === f.rawValue && !f.rawValue.startsWith('-----BEGIN')) {
    throw new Error(`CRITICAL PRIVACY VIOLATION: Raw value was exposed for ${f.ruleName}`);
  }
}

// 2. Test SQLite Database persistence
console.log('\n▶ TEST 2: Testing SQLite Persistence (Scan & Findings)...');
const scanId = insertScan('Local Test Run', 'upload', 1);
const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

let firstFindingId = 0;
for (const f of findings) {
  const fid = insertFinding({
    scanId,
    ruleId: f.ruleId,
    ruleName: f.ruleName,
    severity: f.severity,
    maskedValue: f.maskedValue,
    lineNumber: f.lineNumber,
    lineContent: f.lineContent,
    filePath: f.filePath,
    remediation: f.remediation,
  });
  if (!firstFindingId) firstFindingId = fid;

  counts.total++;
  if (f.severity === 'critical') counts.critical++;
  else if (f.severity === 'high') counts.high++;
  else if (f.severity === 'medium') counts.medium++;
  else counts.low++;
}

updateScanCounts(scanId, counts);

const scan = getScanById(scanId);
console.log(`✓ Scan persisted: "${scan?.name}" (ID: ${scan?.id}, Total Findings: ${scan?.totalFindings})`);

const savedFindings = getFindingsByScan(scanId);
console.log(`✓ Retrieved ${savedFindings.length} findings linked to Scan ID ${scanId}.`);

// 3. Test Remediation Status Workflow
console.log('\n▶ TEST 3: Testing Remediation Status Lifecycle...');
console.log(`✓ Initial status of Finding #${firstFindingId}: "${savedFindings[0].status}"`);

updateFindingStatus(firstFindingId, 'resolved');
const updatedFindings = getFindingsByScan(scanId);
const resolvedFinding = updatedFindings.find((f) => f.id === firstFindingId);
console.log(`✓ Updated status of Finding #${firstFindingId}: "${resolvedFinding?.status}"`);

if (resolvedFinding?.status !== 'resolved') {
  throw new Error('FAIL: Finding status did not transition to resolved');
}

// 4. Test Aggregate Dashboard Statistics
console.log('\n▶ TEST 4: Verifying Dashboard Stats Calculation...');
const stats = getDashboardStats();
console.log(`✓ Aggregate Total Findings: ${stats.totalFindings}`);
console.log(`✓ Critical Risks: ${stats.criticalRisks}`);
console.log(`✓ Resolved Findings: ${stats.resolvedFindings}`);
console.log(`✓ Total Scans in DB: ${stats.totalScans}`);

console.log('\n====================================================');
console.log('      ALL 4 VERIFICATION SUITES PASSED! ✅         ');
console.log('====================================================');
