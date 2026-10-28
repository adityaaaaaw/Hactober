import { scanFiles } from '../lib/scanner';
import {
  insertScan,
  insertFinding,
  updateScanCounts,
  getScanById,
  getFindingsByScan,
  updateFindingStatus,
  getDashboardStats,
} from '../lib/db';

console.log('--- 1. Testing Deterministic Scanner & Masker ---');

const sampleCode = `
// Fake credential test file
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const GITHUB_TOKEN = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
const STRIPE_SECRET = 'sk_test_51MockTestKeyForScannerVerificationOnly99';
const DB_URL = "postgres://adminuser:SecretPassword123@prod-db.internal:5432/appdb";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----";
const API_SECRET = 'api_key = "secret_access_token_super_random_99"';
`;

const findings = scanFiles([
  {
    name: 'src/services/auth.ts',
    content: sampleCode,
  },
]);

console.log(`Detected ${findings.length} findings.`);

for (const f of findings) {
  console.log(`[${f.severity.toUpperCase()}] ${f.ruleName} at ${f.filePath}:${f.lineNumber}`);
  console.log(`  Masked value: ${f.maskedValue}`);
  console.log(`  Line preview: ${f.lineContent}`);

  // Safety assertions
  if (f.maskedValue === f.rawValue && !f.rawValue.startsWith('-----BEGIN')) {
    throw new Error(`FAIL: Raw value was not masked for ${f.ruleName}!`);
  }
}

console.log('\n--- 2. Testing SQLite Persistence & Status Updates ---');
const scanId = insertScan('Test Automated Scan', 'upload', 1);
const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

let testFindingId = 0;
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
  if (!testFindingId) testFindingId = fid;

  counts.total++;
  if (f.severity === 'critical') counts.critical++;
  else if (f.severity === 'high') counts.high++;
  else if (f.severity === 'medium') counts.medium++;
  else counts.low++;
}

updateScanCounts(scanId, counts);

const scan = getScanById(scanId);
console.log('Saved Scan:', scan?.name, 'Total findings recorded:', scan?.totalFindings);

const savedFindings = getFindingsByScan(scanId);
console.log('Retrieved findings count:', savedFindings.length);

console.log('\n--- 3. Testing Resolution Status Workflow ---');
const initialStatus = savedFindings[0].status;
console.log(`Initial status of finding #${testFindingId}: ${initialStatus}`);

updateFindingStatus(testFindingId, 'resolved');
const updatedFindings = getFindingsByScan(scanId);
const updatedFinding = updatedFindings.find((f) => f.id === testFindingId);
console.log(`Updated status of finding #${testFindingId}: ${updatedFinding?.status}`);

if (updatedFinding?.status !== 'resolved') {
  throw new Error('FAIL: Status did not update to resolved!');
}

const stats = getDashboardStats();
console.log('\n--- 4. Dashboard Stats ---');
console.log(`Total Findings: ${stats.totalFindings}, Critical: ${stats.criticalRisks}, Resolved: ${stats.resolvedFindings}, Scans: ${stats.totalScans}`);

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
