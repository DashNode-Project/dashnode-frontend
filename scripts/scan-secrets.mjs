#!/usr/bin/env node
// Blocks secrets and environment files from reaching the repository.
// Scans every tracked or not-yet-ignored file. Exit code 1 when something suspicious is found.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const ALWAYS = [
  { name: 'private key block', re: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: 'generic API secret key', re: /\bsk-[A-Za-z0-9]{24,}\b/ },
  { name: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    name: 'credentials in URL',
    re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@'"]+:[^\s/@'"]{3,}@[^\s/'"]+/i,
  },
];

// Assignments such as `password = "literal"`; ignored in tests/fixtures and for placeholders.
const ASSIGNMENT =
  /\b(?:password|passwd|secret|token|api[_-]?key|private[_-]?key)\w*\s*[:=]\s*(['"])([^'"\s]{8,})\1/i;
const PLACEHOLDER = /change[_-]?me|example|placeholder|your[_-]|<.+>|\$\{|xxxx|\*{4,}/i;
const TEST_FILE = /(?:\.test\.[tj]sx?$|(?:^|\/)src\/test\/)/;

const SKIP_EXT = /\.(?:svg|png|ico|woff2?|lock|map)$|package-lock\.json$/;

function listFiles() {
  const out = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      encoding: 'utf8',
    },
  );
  return out.split('\0').filter(Boolean);
}

const findings = [];

for (const file of listFiles()) {
  if (!existsSync(file)) continue; // deleted but still indexed
  const base = file.split('/').pop() ?? file;
  if (/^\.env(\..+)?$/.test(base) && base !== '.env.example') {
    findings.push(`${file}: environment file must never be committed`);
    continue;
  }
  if (SKIP_EXT.test(file) || file === 'scripts/scan-secrets.mjs') continue;
  if (statSync(file).size > 1_000_000) continue;

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { name, re } of ALWAYS) {
      if (re.test(line) && !PLACEHOLDER.test(line)) {
        findings.push(`${file}:${index + 1}: ${name}`);
      }
    }
    if (!TEST_FILE.test(file)) {
      const match = ASSIGNMENT.exec(line);
      const value = match?.[2] ?? '';
      // Identifier-like names ('password', 'confirmPassword') are not secrets: require a mix of
      // letters and digits, or a long opaque value.
      const looksSecret = (/\d/.test(value) && /[A-Za-z]/.test(value)) || value.length >= 24;
      if (match && looksSecret && !PLACEHOLDER.test(value)) {
        findings.push(`${file}:${index + 1}: hard-coded credential-like literal`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error('Secret scan FAILED:');
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}
console.info(`Secret scan clean (${listFiles().length} files).`);
