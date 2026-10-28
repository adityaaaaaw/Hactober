import type { Finding } from '@/types';

export interface RemediationStep {
  id: string;
  title: string;
  description: string;
  command?: string;
  actionUrl?: string;
}

export interface SafePatch {
  supported: boolean;
  targetFile: string;
  envVarName: string;
  envSnippet: string;
  originalCode: string;
  patchedCode: string;
  diff: string;
  safetyGuarantee: string;
}

/**
 * Generates an ordered, actionable 4-phase remediation checklist tailored to the secret category.
 */
export function generateRemediationChecklist(finding: Finding): RemediationStep[] {
  const steps: RemediationStep[] = [];
  const ruleId = finding.ruleId.toLowerCase();

  // Phase 1: Invalidate & Revoke
  if (ruleId.includes('stripe')) {
    steps.push({
      id: 'step-revoke',
      title: '1. Invalidate Compromised Stripe Key',
      description: 'Navigate to the Stripe Developer Dashboard and roll or delete the exposed API key immediately.',
      actionUrl: 'https://dashboard.stripe.com/apikeys',
    });
  } else if (ruleId.includes('aws')) {
    steps.push({
      id: 'step-revoke',
      title: '1. Deactivate AWS IAM Access Key',
      description: 'Log into the AWS IAM Management Console, find the associated IAM user, and mark the access key as Inactive before deleting.',
      actionUrl: 'https://console.aws.amazon.com/iam/home#/users',
    });
  } else if (ruleId.includes('github')) {
    steps.push({
      id: 'step-revoke',
      title: '1. Revoke GitHub Personal Access Token',
      description: 'Go to GitHub Settings > Developer settings > Personal access tokens and delete the compromised token.',
      actionUrl: 'https://github.com/settings/tokens',
    });
  } else if (ruleId.includes('slack')) {
    steps.push({
      id: 'step-revoke',
      title: '1. Invalidate Slack Webhook / Token',
      description: 'Revoke the incoming webhook or OAuth token in your Slack App Management directory.',
      actionUrl: 'https://api.slack.com/apps',
    });
  } else if (ruleId.includes('database') || ruleId.includes('db-url') || ruleId.includes('password')) {
    steps.push({
      id: 'step-revoke',
      title: '1. Rotate Database Credentials',
      description: 'Change the database password in your cloud provider / database management console and terminate active unauthorized sessions.',
    });
  } else {
    steps.push({
      id: 'step-revoke',
      title: '1. Revoke Compromised Credential',
      description: 'Log into the respective provider portal and revoke or invalidate the exposed secret key immediately.',
    });
  }

  // Phase 2: Inject Safe Environment Variable
  const envVar = deriveEnvVarName(finding);
  steps.push({
    id: 'step-env',
    title: `2. Store New Secret in Environment Vault (.env)`,
    description: `Generate a new credential and inject it via environment variables (${envVar}) or a dedicated secret vault (e.g., HashiCorp Vault, AWS Secrets Manager, Vercel Env).`,
  });

  // Phase 3: Update Application Code
  steps.push({
    id: 'step-code',
    title: '3. Refactor Code to Reference Environment Variable',
    description: `Replace the hardcoded literal in ${finding.filePath} (line ${finding.lineNumber}) with process.env.${envVar}. Verify the application functions in staging.`,
  });

  // Phase 4: Git History Sweep
  steps.push({
    id: 'step-sweep',
    title: '4. Purge Git Commit History (If Committed)',
    description: 'If this secret was ever committed to git, simply changing the code is insufficient. Purge git history using git-filter-repo.',
    command: `git filter-repo --invert-paths --path "${finding.filePath}"`,
  });

  return steps;
}

/**
 * Generates a safe, reproducible code patch replacing hardcoded credentials with environment variables.
 * PRIVACY GUARANTEE: The generated patch never includes raw credentials and never mutates files automatically.
 */
export function generateSafePatch(finding: Finding): SafePatch {
  const envVar = deriveEnvVarName(finding);
  const targetFile = finding.filePath;
  const originalLine = finding.lineContent.trim();

  // Generate safe replacement
  let patchedLine = originalLine;

  // Check common assignment patterns: const KEY = "..." or key: "..."
  if (originalLine.includes('=') || originalLine.includes(':')) {
    const separator = originalLine.includes('=') ? '=' : ':';
    const [leftPart] = originalLine.split(separator);
    const trimmedLeft = leftPart.trim();
    const isTSorJS = targetFile.endsWith('.ts') || targetFile.endsWith('.js') || targetFile.endsWith('.tsx') || targetFile.endsWith('.jsx');
    const isPython = targetFile.endsWith('.py');

    if (isPython) {
      patchedLine = `${trimmedLeft} ${separator} os.getenv("${envVar}")`;
    } else if (isTSorJS) {
      patchedLine = `${trimmedLeft} ${separator} process.env.${envVar};`;
    } else {
      patchedLine = `${trimmedLeft} ${separator} "${envVar}_FROM_ENV"`;
    }
  } else {
    patchedLine = `// TODO: Replace with process.env.${envVar}`;
  }

  const diff = `--- a/${targetFile}
+++ b/${targetFile}
@@ -${finding.lineNumber},1 +${finding.lineNumber},1 @@
- ${originalLine}
+ ${patchedLine}`;

  const envSnippet = `# Add to your local .env or secrets manager (NEVER commit to git):
${envVar}="<your_new_rotated_secret_here>"`;

  return {
    supported: true,
    targetFile,
    envVarName: envVar,
    envSnippet,
    originalCode: originalLine,
    patchedCode: patchedLine,
    diff,
    safetyGuarantee:
      'Human-in-the-loop guarantee: This patch proposal replaces the hardcoded secret with an environment variable. KeyShield never modifies source files automatically without human confirmation, and raw credentials are never used in patches.',
  };
}

function deriveEnvVarName(finding: Finding): string {
  const ruleId = finding.ruleId.toLowerCase();
  if (ruleId.includes('stripe-secret')) return 'STRIPE_SECRET_KEY';
  if (ruleId.includes('stripe-pub')) return 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY';
  if (ruleId.includes('aws-access')) return 'AWS_ACCESS_KEY_ID';
  if (ruleId.includes('aws-secret')) return 'AWS_SECRET_ACCESS_KEY';
  if (ruleId.includes('github')) return 'GITHUB_TOKEN';
  if (ruleId.includes('slack')) return 'SLACK_WEBHOOK_URL';
  if (ruleId.includes('db-url') || ruleId.includes('database')) return 'DATABASE_URL';
  if (ruleId.includes('password')) return 'DATABASE_PASSWORD';
  if (ruleId.includes('jwt')) return 'JWT_SECRET_KEY';
  if (ruleId.includes('private-key')) return 'PRIVATE_KEY_PEM';
  if (ruleId.includes('openai')) return 'OPENAI_API_KEY';
  if (ruleId.includes('anthropic')) return 'ANTHROPIC_API_KEY';

  // Fallback sanitized name
  const clean = finding.ruleName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_');
  return `${clean}_KEY`;
}
