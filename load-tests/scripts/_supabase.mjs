// Shared helpers for the load-test tooling.
//
// This file talks to Supabase *directly* (GoTrue + PostgREST) using the
// service-role key, so it can mint real user sessions and seed data WITHOUT
// going through the app's login page — which is important because the app's
// login/signup are gated by a Cloudflare Turnstile CAPTCHA (see
// components/Turnstile.tsx). Admin endpoints bypass that CAPTCHA.
//
// It also reproduces, byte-for-byte, the auth cookie that @supabase/ssr@0.5.2
// writes, so k6 can present a cookie the deployed app will accept as a
// logged-in session. See node_modules/@supabase/ssr/dist/main/cookies.js and
// utils/chunker.js for the format this mirrors.

const MAX_CHUNK_SIZE = 3180; // matches ssr utils/chunker.js
const BASE64_PREFIX = "base64-"; // matches ssr cookies.js

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy load-tests/.env.loadtest.example ` +
        `to load-tests/.env.loadtest and fill it in, then re-run with ` +
        `\`node --env-file=load-tests/.env.loadtest ...\`.`
    );
  }
  return v;
}

export function getConfig() {
  const supabaseUrl = requireEnv("LT_SUPABASE_URL").replace(/\/+$/, "");
  return {
    supabaseUrl,
    anonKey: requireEnv("LT_SUPABASE_ANON_KEY"),
    serviceKey: requireEnv("LT_SUPABASE_SERVICE_ROLE_KEY"),
    // The cookie name storage key derives from the project ref the same way
    // supabase-js does: the first label of the hostname.
    projectRef:
      process.env.LT_PROJECT_REF || new URL(supabaseUrl).hostname.split(".")[0],
  };
}

export function cookieName(projectRef) {
  return `sb-${projectRef}-auth-token`;
}

// Port of @supabase/ssr utils/chunker.js createChunks(). We only need the
// encoded value split into cookie chunks; the app's read path recombines
// `.0`, `.1`, ... automatically.
function createChunks(key, value, chunkSize = MAX_CHUNK_SIZE) {
  let encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= chunkSize) return [{ name: key, value }];

  const chunks = [];
  while (encodedValue.length > 0) {
    let head = encodedValue.slice(0, chunkSize);
    const lastEscape = head.lastIndexOf("%");
    if (lastEscape > chunkSize - 3) head = head.slice(0, lastEscape);

    let valueHead = "";
    while (head.length > 0) {
      try {
        valueHead = decodeURIComponent(head);
        break;
      } catch (err) {
        if (head.at(-3) === "%" && head.length > 3) {
          head = head.slice(0, head.length - 3);
        } else {
          throw err;
        }
      }
    }
    chunks.push(valueHead);
    encodedValue = encodedValue.slice(head.length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

// Given a GoTrue session object, produce the array of { name, value } cookies
// the deployed app expects. Cookie encoding is "base64url" (the ssr default).
export function sessionToCookies(projectRef, session) {
  const json = JSON.stringify(session);
  const encoded = BASE64_PREFIX + Buffer.from(json, "utf8").toString("base64url");
  return createChunks(cookieName(projectRef), encoded);
}

// Render a set of cookies into a single Cookie: header value.
export function cookieHeader(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function gotrue(cfg, path, { method = "POST", body, admin = false } = {}) {
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1${path}`, {
    method,
    headers: {
      apikey: admin ? cfg.serviceKey : cfg.anonKey,
      Authorization: `Bearer ${admin ? cfg.serviceKey : cfg.anonKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

// Create a confirmed test user (idempotent). Admin endpoint → no CAPTCHA.
export async function ensureUser(cfg, email, password) {
  const created = await gotrue(cfg, "/admin/users", {
    admin: true,
    body: { email, password, email_confirm: true },
  });
  if (created.ok) return created.json;

  const msg = JSON.stringify(created.json).toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || created.status === 422) {
    // Already exists — look them up so we still return an id.
    const found = await gotrue(
      cfg,
      `/admin/users?email=${encodeURIComponent(email)}`,
      { admin: true, method: "GET" }
    );
    const user = found.json?.users?.[0] || found.json?.[0] || found.json;
    return user;
  }
  throw new Error(`ensureUser(${email}) failed: ${created.status} ${JSON.stringify(created.json)}`);
}

// Mint a real session for an existing user WITHOUT a password or CAPTCHA:
// admin generate_link produces a one-time token, which /verify exchanges for
// a full session (access_token + refresh_token). Both steps are CAPTCHA-immune.
export async function mintSession(cfg, email) {
  const link = await gotrue(cfg, "/admin/generate_link", {
    admin: true,
    body: { type: "magiclink", email },
  });
  if (!link.ok) {
    throw new Error(`generate_link(${email}) failed: ${link.status} ${JSON.stringify(link.json)}`);
  }
  const hashedToken = link.json.hashed_token || link.json.properties?.hashed_token;
  if (!hashedToken) {
    throw new Error(`generate_link(${email}) returned no hashed_token: ${JSON.stringify(link.json)}`);
  }

  const verified = await gotrue(cfg, "/verify", {
    body: { type: "magiclink", token: hashedToken },
  });
  if (!verified.ok || !verified.json.access_token) {
    throw new Error(`verify(${email}) failed: ${verified.status} ${JSON.stringify(verified.json)}`);
  }
  return verified.json; // full GoTrue session object
}

// PostgREST helper (service role) for reading/seeding rows.
export async function rest(cfg, path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${cfg.supabaseUrl}/rest/v1${path}`, {
    method,
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`REST ${method} ${path} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}
