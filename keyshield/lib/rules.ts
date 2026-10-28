import type { SecretRule } from '@/types';

/**
 * Deterministic secret-detection rules.
 * Rules use RegExp patterns — no code execution of the scanned content.
 */
export const SECRET_RULES: SecretRule[] = [
  // ─── AWS ─────────────────────────────────────────────────────────────────
  {
    id: 'aws-access-key',
    name: 'AWS Access Key ID',
    description: 'Amazon Web Services Access Key ID',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: 'critical',
    remediation:
      'Immediately rotate the AWS key in IAM, revoke the old one, and use AWS Secrets Manager or environment variables instead of hardcoding.',
  },
  {
    id: 'aws-secret-key',
    name: 'AWS Secret Access Key',
    description: 'Amazon Web Services Secret Access Key (40-char base64)',
    pattern: /(?:aws[_\-.]?secret[_\-.]?(?:access[_\-.]?)?key|aws_secret)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    severity: 'critical',
    remediation:
      'Rotate the key in IAM Console. Store secrets in AWS Secrets Manager or SSM Parameter Store.',
  },

  // ─── GitHub ──────────────────────────────────────────────────────────────
  {
    id: 'github-pat',
    name: 'GitHub Personal Access Token',
    description: 'GitHub classic or fine-grained personal access token',
    pattern: /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/g,
    severity: 'critical',
    remediation:
      'Revoke the token at github.com/settings/tokens. Use GitHub Actions secrets or a secret manager.',
  },
  {
    id: 'github-oauth',
    name: 'GitHub OAuth Token',
    description: 'GitHub OAuth application token',
    pattern: /\bgho_[A-Za-z0-9]{36}\b/g,
    severity: 'critical',
    remediation:
      'Revoke the OAuth token. Use environment variables and GitHub Actions secrets.',
  },

  // ─── Stripe ──────────────────────────────────────────────────────────────
  {
    id: 'stripe-secret',
    name: 'Stripe Secret Key',
    description: 'Stripe live or test secret key',
    pattern: /\bsk_(live|test)_[A-Za-z0-9]{24,99}\b/g,
    severity: 'critical',
    remediation:
      'Roll the key at dashboard.stripe.com/apikeys. Never commit Stripe keys; use environment variables.',
  },
  {
    id: 'stripe-publishable',
    name: 'Stripe Publishable Key',
    description: 'Stripe publishable key (lower risk but should not be hardcoded)',
    pattern: /\bpk_(live|test)_[A-Za-z0-9]{24,99}\b/g,
    severity: 'medium',
    remediation:
      'Although publishable keys are lower risk, move them to environment variables for consistency.',
  },

  // ─── Slack ───────────────────────────────────────────────────────────────
  {
    id: 'slack-token',
    name: 'Slack API Token',
    description: 'Slack bot, user, or workspace OAuth token',
    pattern: /\bxox[bpars]-[0-9A-Za-z\-]{10,99}\b/g,
    severity: 'high',
    remediation:
      'Revoke the token at api.slack.com/apps and re-issue. Store in environment variables.',
  },
  {
    id: 'slack-webhook',
    name: 'Slack Webhook URL',
    description: 'Slack incoming webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
    severity: 'high',
    remediation:
      'Regenerate the webhook in Slack app settings. Treat webhook URLs as secrets.',
  },

  // ─── Google ──────────────────────────────────────────────────────────────
  {
    id: 'google-api-key',
    name: 'Google API Key',
    description: 'Google API / Firebase API key',
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    severity: 'high',
    remediation:
      'Restrict or regenerate the key in GCP Console. Apply API restrictions and use Secret Manager.',
  },
  {
    id: 'google-oauth',
    name: 'Google OAuth Client Secret',
    description: 'Google OAuth 2.0 client secret',
    pattern: /GOCSPX-[A-Za-z0-9\-]{28}/g,
    severity: 'critical',
    remediation:
      'Regenerate the secret in GCP Console > APIs & Services > Credentials. Store in env vars.',
  },

  // ─── Twilio ──────────────────────────────────────────────────────────────
  {
    id: 'twilio-sid',
    name: 'Twilio Account SID',
    description: 'Twilio Account SID',
    pattern: /\bAC[a-fA-F0-9]{32}\b/g,
    severity: 'medium',
    remediation:
      'Pair with auth-token detection. Move to environment variables and Twilio Flex secrets.',
  },
  {
    id: 'twilio-auth-token',
    name: 'Twilio Auth Token',
    description: 'Twilio Auth Token (32-char hex)',
    pattern: /(?:twilio[_\-.]?auth[_\-.]?token|TWILIO_AUTH_TOKEN)\s*[:=]\s*["']?([a-fA-F0-9]{32})["']?/gi,
    severity: 'critical',
    remediation:
      'Rotate the auth token in the Twilio Console. Store it in environment variables only.',
  },

  // ─── Database connection strings ──────────────────────────────────────────
  {
    id: 'db-connection-string',
    name: 'Database Connection String',
    description: 'Connection string containing credentials',
    pattern: /(?:mongodb(?:\+srv)?|postgres|postgresql|mysql|redis):\/\/[^:@\s]+:[^@\s]+@[^\s"']+/gi,
    severity: 'critical',
    remediation:
      'Remove credentials from the connection string. Use IAM auth, password managers, or env vars.',
  },

  // ─── OpenAI / Anthropic ──────────────────────────────────────────────────
  {
    id: 'openai-key',
    name: 'OpenAI API Key',
    description: 'OpenAI API key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9\-_]{20,64}\b/g,
    severity: 'critical',
    remediation:
      'Revoke the key at platform.openai.com/api-keys. Store it in environment variables.',
  },
  {
    id: 'anthropic-key',
    name: 'Anthropic API Key',
    description: 'Anthropic / Claude API key',
    pattern: /\bsk-ant-[A-Za-z0-9\-_]{40,100}\b/g,
    severity: 'critical',
    remediation:
      'Revoke the key in the Anthropic Console. Store it in environment variables.',
  },

  // ─── Firebase / Supabase ─────────────────────────────────────────────────
  {
    id: 'supabase-key',
    name: 'Supabase Service Key',
    description: 'Supabase service role or anon JWT token',
    pattern: /\beyJ[A-Za-z0-9\-_=]{50,}\.eyJ[A-Za-z0-9\-_=]{20,}\.[A-Za-z0-9\-_.+/=]{20,}\b/g,
    severity: 'high',
    remediation:
      'Regenerate keys in your Supabase project settings. Use RLS policies and limit key scope.',
  },

  // ─── Private Keys / Certificates ─────────────────────────────────────────
  {
    id: 'rsa-private-key',
    name: 'RSA Private Key',
    description: 'PEM-encoded RSA private key block',
    pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
    severity: 'critical',
    remediation:
      'Never commit private keys. Generate a new key pair and revoke the exposed one. Use a key management service.',
  },
  {
    id: 'ec-private-key',
    name: 'EC / Generic Private Key',
    description: 'PEM-encoded EC or generic private key block',
    pattern: /-----BEGIN (?:EC |OPENSSH |)PRIVATE KEY-----/g,
    severity: 'critical',
    remediation:
      'Revoke this private key. Generate a new key pair and store it in a secrets vault.',
  },

  // ─── JWT ─────────────────────────────────────────────────────────────────
  {
    id: 'jwt-secret',
    name: 'JWT Secret / Signing Key',
    description: 'JWT secret key assignment in source code',
    pattern: /(?:jwt[_\-.]?secret|JWT_SECRET|signing[_\-.]?key)\s*[:=]\s*["']([^"'\s]{8,128})["']/gi,
    severity: 'high',
    remediation:
      'Rotate the JWT secret. Store it only in environment variables and never in source control.',
  },

  // ─── Generic high-entropy passwords / tokens ─────────────────────────────
  {
    id: 'generic-password',
    name: 'Hardcoded Password',
    description: 'Password assignment in code (generic pattern)',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\s]{8,64})["']/gi,
    severity: 'high',
    remediation:
      'Remove the hardcoded password. Use a secrets manager or environment variables at runtime.',
  },
  {
    id: 'generic-api-key',
    name: 'Generic API Key Assignment',
    description: 'API key or token variable assignment',
    pattern: /(?:api[_\-.]?key|apikey|access[_\-.]?token|auth[_\-.]?token)\s*[:=]\s*["']([A-Za-z0-9\-_./+=]{16,128})["']/gi,
    severity: 'high',
    remediation:
      'Move the key into an environment variable (e.g., process.env.API_KEY) and add it to .gitignore.',
  },
];
