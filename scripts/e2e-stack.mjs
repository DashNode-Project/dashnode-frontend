#!/usr/bin/env node
// End-to-end integration check of the running stack (browser-facing nginx -> API -> PostgreSQL).
//
//   node scripts/e2e-stack.mjs [--base http://localhost:8080] [--env-file ../dashnode-backend/.env]
//
// It speaks HTTP exactly as the browser does (same origin, cookie jar, Origin header) and verifies
// the acceptance criteria of EP-01 that cross the network boundary: literal messages, cookie
// flags, 8 h expiry, logout invalidation, brute-force lock, role manipulation and CSRF origin.
// Optional seeded accounts (admin / developer / disabled) are read from the env file or the
// process environment; checks that need them are skipped when they are absent. No secret is
// ever printed.
import { randomBytes } from 'node:crypto';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const envFile = option('--env-file');
if (envFile) process.loadEnvFile(envFile);

const BASE = option('--base', process.env.E2E_BASE_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
);
const API = `${BASE}/api/v1`;

const MSG = {
  nameRequired: 'El nombre completo es obligatorio.',
  emailInvalid: 'El correo electrónico ingresado no tiene un formato válido.',
  emailTaken: 'Ya existe una cuenta registrada con este correo electrónico.',
  passwordWeak: 'La contraseña no cumple los requisitos mínimos de seguridad.',
  mismatch: 'Las contraseñas no coinciden.',
  required: 'Todos los campos obligatorios deben ser diligenciados.',
  roleNotAllowed: 'El registro público solo está disponible para el rol Gerente.',
  registered: 'Su cuenta de Gerente ha sido registrada correctamente. Puede iniciar sesión.',
  badCredentials: 'Credenciales no válidas. Verifique su correo y contraseña.',
  tooMany: 'Ha superado el número de intentos permitidos. Intente nuevamente más tarde.',
  disabled: 'Su cuenta está desactivada. Contacte al Administrador.',
  loggedOut: 'Sesión cerrada correctamente.',
};

let passed = 0;
let failed = 0;
const skipped = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.info(`  ok   ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

/** Minimal cookie jar: keeps the cookies a browser would send back. */
class Jar {
  cookies = new Map();
  absorb(response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (value === '' || /max-age=0/i.test(line)) this.cookies.delete(name.trim());
      else this.cookies.set(name.trim(), value);
    }
  }
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function call(method, path, { body, jar, origin = BASE, raw = false } = {}) {
  const headers = { Accept: 'application/json', Origin: origin };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (jar && jar.cookies.size > 0) headers.Cookie = jar.header();
  const response = await fetch(`${raw ? BASE : API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  jar?.absorb(response);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, json, text };
}

const code = (r) => r.json?.error?.code;
const message = (r) => r.json?.error?.message;
const unique = (label) =>
  `e2e.${label}.${Date.now()}.${randomBytes(3).toString('hex')}@example.test`;
const strongPassword = () => `${randomBytes(9).toString('base64url')}a1`;

async function section(title, fn) {
  console.info(`\n${title}`);
  try {
    await fn();
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${title}: unexpected error ${error?.name}: ${error?.message}`);
  }
}

await section('HU_DN_01_01  public page and SPA hosting', async () => {
  const home = await call('GET', '/', { raw: true });
  check(
    'landing served without session',
    home.status === 200 && home.text.includes('<div id="root">'),
  );
  const spa = await call('GET', '/inicio/gerente', { raw: true });
  check(
    'SPA fallback for client-side routes',
    spa.status === 200 && spa.text.includes('<div id="root">'),
  );
  const assets = [...home.text.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  check('build assets referenced by index.html', assets.length >= 2);
  for (const asset of assets) {
    const r = await call('GET', asset, { raw: true });
    check(
      `asset ${asset.split('/').pop()} is served and cacheable`,
      r.status === 200 && /immutable/.test(r.headers.get('cache-control') ?? ''),
    );
  }
  check('index.html is never cached', /no-store/.test(home.headers.get('cache-control') ?? ''));
  check(
    'CSP forbids framing and inline scripts',
    /frame-ancestors 'none'/.test(home.headers.get('content-security-policy') ?? '') &&
      !/script-src[^;]*unsafe-inline/.test(home.headers.get('content-security-policy') ?? ''),
  );
  check('nosniff header present', home.headers.get('x-content-type-options') === 'nosniff');
});

await section('Gateway / platform', async () => {
  check(
    'API reachable through the same origin',
    (await call('GET', '/auth/session')).status === 401,
  );
  const r = await call('GET', '/auth/session');
  check('API responses are never cached', /no-store/.test(r.headers.get('cache-control') ?? ''));
  check('no session -> NOT_AUTHENTICATED', code(r) === 'NOT_AUTHENTICATED');
});

const managerEmail = unique('manager');
const managerPassword = strongPassword();

await section('HU_DN_01_02  register Manager', async () => {
  const valid = {
    name: 'Gerente E2E',
    email: managerEmail,
    password: managerPassword,
    confirm_password: managerPassword,
  };
  const cases = [
    ['empty name', { ...valid, name: '' }, 400, 'NAME_REQUIRED', MSG.nameRequired],
    ['bad e-mail', { ...valid, email: 'sin-formato' }, 400, 'EMAIL_INVALID', MSG.emailInvalid],
    [
      'weak password',
      { ...valid, password: 'abc', confirm_password: 'abc' },
      400,
      'PASSWORD_WEAK',
      MSG.passwordWeak,
    ],
    [
      'mismatch',
      { ...valid, confirm_password: `${managerPassword}x` },
      400,
      'PASSWORD_MISMATCH',
      MSG.mismatch,
    ],
  ];
  for (const [label, body, status, errorCode, text] of cases) {
    const r = await call('POST', '/auth/register', { body });
    check(
      `${label} -> ${status} ${errorCode}`,
      r.status === status && code(r) === errorCode && message(r) === text,
      `${r.status} ${code(r)}`,
    );
  }
  for (const role of ['developer', 'admin']) {
    const r = await call('POST', '/auth/register', {
      body: { ...valid, email: unique(role), role },
    });
    check(
      `manipulated role "${role}" rejected`,
      r.status === 403 && code(r) === 'ROLE_NOT_ALLOWED' && message(r) === MSG.roleNotAllowed,
    );
  }
  const created = await call('POST', '/auth/register', { body: valid });
  check('valid registration -> 201', created.status === 201, `${created.status} ${code(created)}`);
  check('success message is the literal one', created.json?.message === MSG.registered);
  check(
    'response has no password or hash',
    !/password|hash/i.test(JSON.stringify(created.json?.user ?? {})),
  );
  check('registered user is a manager', created.json?.user?.role === 'manager');
  const dup = await call('POST', '/auth/register', {
    body: { ...valid, email: managerEmail.toUpperCase() },
  });
  check(
    'duplicate e-mail (any case) -> 409',
    dup.status === 409 && message(dup) === MSG.emailTaken,
  );
  const evil = await call('POST', '/auth/register', {
    body: { ...valid, email: unique('evil') },
    origin: 'http://evil.example',
  });
  check(
    'foreign Origin rejected (CSRF)',
    evil.status === 403 && code(evil) === 'ORIGIN_NOT_ALLOWED',
    `${evil.status} ${code(evil)}`,
  );
});

await section('HU_DN_01_03 / 04 / 05  login, session, logout', async () => {
  const jar = new Jar();
  const bad = await call('POST', '/auth/login', {
    body: { email: managerEmail, password: `${managerPassword}x` },
  });
  const unknown = await call('POST', '/auth/login', {
    body: { email: unique('ghost'), password: managerPassword },
  });
  check(
    'wrong password -> generic credentials message',
    bad.status === 401 && message(bad) === MSG.badCredentials,
  );
  check(
    'unknown e-mail -> identical answer',
    unknown.status === 401 &&
      message(unknown) === MSG.badCredentials &&
      code(unknown) === code(bad),
  );
  const blank = await call('POST', '/auth/login', { body: { email: '', password: '' } });
  check(
    'blank fields -> required message',
    blank.status === 400 && message(blank) === MSG.required,
  );

  const login = await call('POST', '/auth/login', {
    body: { email: managerEmail, password: managerPassword },
    jar,
  });
  check('login -> 200', login.status === 200, `${login.status} ${code(login)}`);
  const setCookie = login.headers.getSetCookie().join(' | ');
  check('session cookie is HttpOnly', /httponly/i.test(setCookie));
  check('session cookie is SameSite=Lax', /samesite=lax/i.test(setCookie));
  check('session cookie scoped to /', /path=\//i.test(setCookie));
  check('token never appears in the body', !/token|dashnode_session/i.test(login.text));
  const expires = Date.parse(login.json?.expires_at ?? '');
  const hours = (expires - Date.now()) / 3_600_000;
  check('session lasts 8 hours from login', hours > 7.9 && hours <= 8.01, `${hours.toFixed(3)} h`);
  check('login answers the user with role manager', login.json?.user?.role === 'manager');

  const session = await call('GET', '/auth/session', { jar });
  check(
    'GET /auth/session restores the user (reload)',
    session.status === 200 && session.json?.user?.email === managerEmail.toLowerCase(),
  );
  check(
    'session is not renewed by checking it',
    session.json?.expires_at === login.json?.expires_at,
  );

  const out = await call('POST', '/auth/logout');
  check(
    'logout without cookie is idempotent',
    out.status === 200 && out.json?.message === MSG.loggedOut,
  );

  const stolen = jar.header();
  const logout = await call('POST', '/auth/logout', { jar });
  check(
    'logout -> 200 with the literal message',
    logout.status === 200 && logout.json?.message === MSG.loggedOut,
  );
  check('logout clears the cookie', jar.cookies.size === 0);
  const replay = await fetch(`${API}/auth/session`, { headers: { Cookie: stolen, Origin: BASE } });
  check('previous session rejected after logout', replay.status === 401, `${replay.status}`);
});

await section('HU_DN_01_03  brute force protection', async () => {
  const email = unique('lock');
  const password = strongPassword();
  await call('POST', '/auth/register', {
    body: { name: 'Lock E2E', email, password, confirm_password: password },
  });
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const r = await call('POST', '/auth/login', { body: { email, password: `${password}x` } });
    check(
      `failed attempt ${attempt} -> credentials message`,
      r.status === 401 && message(r) === MSG.badCredentials,
    );
  }
  const sixth = await call('POST', '/auth/login', { body: { email, password: `${password}x` } });
  check(
    'sixth attempt in 15 minutes rejected',
    sixth.status === 429 && message(sixth) === MSG.tooMany,
    `${sixth.status}`,
  );
  const correct = await call('POST', '/auth/login', { body: { email, password } });
  check('even the correct password is rejected while locked', correct.status === 429);
});

await section('Seeded accounts (optional)', async () => {
  const accounts = [
    ['admin', process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, 'admin'],
    [
      'developer',
      process.env.SEED_DEVELOPER_EMAIL,
      process.env.SEED_DEVELOPER_PASSWORD,
      'developer',
    ],
  ];
  for (const [label, email, password, role] of accounts) {
    if (!email || !password) {
      skipped.push(`${label} login (SEED_* not provided)`);
      continue;
    }
    const jar = new Jar();
    const r = await call('POST', '/auth/login', { body: { email, password }, jar });
    if (r.status === 401) {
      skipped.push(`${label} login (account not seeded: run the seed command)`);
      continue;
    }
    check(
      `${label} logs in and gets role ${role}`,
      r.status === 200 && r.json?.user?.role === role,
    );
    await call('POST', '/auth/logout', { jar });
  }
  const email = process.env.SEED_DISABLED_EMAIL;
  const password = process.env.SEED_DISABLED_PASSWORD;
  if (email && password) {
    const r = await call('POST', '/auth/login', { body: { email, password } });
    if (r.status === 401) skipped.push('disabled account (not seeded)');
    else
      check(
        'disabled account with correct password is refused',
        r.status === 403 && message(r) === MSG.disabled,
      );
    const wrong = await call('POST', '/auth/login', { body: { email, password: `${password}x` } });
    check(
      'disabled account with wrong password reveals nothing',
      wrong.status === 401 || wrong.status === 429,
    );
  } else {
    skipped.push('disabled account (SEED_* not provided)');
  }
});

console.info(`\n${passed} checks passed, ${failed} failed, ${skipped.length} skipped`);
for (const item of skipped) console.info(`  skipped: ${item}`);
process.exit(failed === 0 ? 0 : 1);
