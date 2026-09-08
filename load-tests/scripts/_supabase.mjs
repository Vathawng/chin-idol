// Shared helpers for the load-test tooling.
//
// Since voting is anonymous (no accounts, the Stripe payment is the gate),
// this no longer needs to mint user sessions or forge auth cookies — it just
// needs to read a few ids (contestants, the open round) to feed the scenarios.
// It talks to Supabase PostgREST directly with the service-role key.

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
  };
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
