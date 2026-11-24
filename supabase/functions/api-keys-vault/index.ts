import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://aldur13.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const enc = new TextEncoder();
const providers = new Set([
  "groq", "gemini", "sambanova", "kimi", "anthropic",
  "openai", "mistral", "openrouter", "hf",
]);

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function b64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function unb64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function cleanVault(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Ogiltig nyckelkonfiguration.");
  }
  const input = value as Record<string, unknown>;
  const primary: Record<string, Array<{ key: string; model: string; model2: string }>> = {};
  if (input.primary && typeof input.primary === "object" && !Array.isArray(input.primary)) {
    for (const [provider, rawRows] of Object.entries(input.primary as Record<string, unknown>)) {
      if (!providers.has(provider) || !Array.isArray(rawRows)) continue;
      const rows = rawRows.slice(0, 3).flatMap(raw => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
        const row = raw as Record<string, unknown>;
        const key = typeof row.key === "string" ? row.key.trim() : "";
        if (!key || key.length > 4096) return [];
        return [{
          key,
          model: typeof row.model === "string" ? row.model.slice(0, 160) : "",
          model2: typeof row.model2 === "string" ? row.model2.slice(0, 160) : "",
        }];
      });
      if (rows.length) primary[provider] = rows;
    }
  }
  const judges = Array.isArray(input.judges) ? input.judges.slice(0, 2).flatMap(raw => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const row = raw as Record<string, unknown>;
    const prov = typeof row.prov === "string" ? row.prov : "";
    const key = typeof row.key === "string" ? row.key.trim() : "";
    if (!providers.has(prov) || !key || key.length > 4096) return [];
    return [{ prov, key, model: typeof row.model === "string" ? row.model.slice(0, 160) : "" }];
  }) : [];
  const cleaned = { version: 1, primary, judges };
  if (JSON.stringify(cleaned).length > 50000) throw new Error("Nyckelkonfigurationen är för stor.");
  return cleaned;
}

async function vaultKey() {
  const secret = Deno.env.get("FLASHCARDS_VAULT_KEY") || "";
  if (secret.length < 32) throw new Error("Serverns krypteringsnyckel saknas. Administratören måste konfigurera FLASHCARDS_VAULT_KEY.");
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(uid: string, value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await vaultKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: enc.encode(uid) },
    key,
    enc.encode(JSON.stringify(value)),
  );
  return { v: 1, alg: "A256GCM", iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) };
}

async function decrypt(uid: string, payload: Record<string, unknown>) {
  if (payload.v !== 1 || payload.alg !== "A256GCM" ||
      typeof payload.iv !== "string" || typeof payload.ciphertext !== "string") {
    throw new Error("Kunde inte läsa den krypterade nyckelkonfigurationen.");
  }
  const key = await vaultKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(payload.iv), additionalData: enc.encode(uid) },
    key,
    unb64(payload.ciphertext),
  );
  return cleanVault(JSON.parse(new TextDecoder().decode(plaintext)));
}

serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const origin = request.headers.get("origin") || "";
  if (origin && origin !== "https://aldur13.github.io" && !origin.startsWith("http://localhost:")) {
    return response({ error: "Origin not allowed" }, 403);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const authorization = request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!supabaseUrl || !anonKey || !serviceKey || !match) {
      return response({ error: "Inloggning krävs." }, 401);
    }

    const userResponse = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: { apikey: anonKey, authorization: "Bearer " + match[1] },
    });
    if (!userResponse.ok) return response({ error: "Sessionen är ogiltig. Logga in igen." }, 401);
    const user = await userResponse.json();
    if (!user || typeof user.id !== "string") return response({ error: "Sessionen är ogiltig." }, 401);
    const uid = user.id;

    const raw = await request.text();
    if (raw.length > 60000) return response({ error: "Begäran är för stor." }, 413);
    const body = JSON.parse(raw);
    const restHeaders = {
      apikey: serviceKey,
      authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
    };
    const rowUrl = supabaseUrl + "/rest/v1/api_key_vault?user_id=eq." + encodeURIComponent(uid);

    if (body.action === "get") {
      const stored = await fetch(rowUrl + "&select=encrypted_payload", { headers: restHeaders });
      if (!stored.ok) return response({ error: "Kunde inte läsa nyckelvalvet." }, 502);
      const rows = await stored.json();
      if (!Array.isArray(rows) || !rows.length) return response({ vault: { version: 1, primary: {}, judges: [] } });
      return response({ vault: await decrypt(uid, rows[0].encrypted_payload) });
    }

    if (body.action === "save") {
      const vault = cleanVault(body.vault);
      const encrypted_payload = await encrypt(uid, vault);
      const saved = await fetch(supabaseUrl + "/rest/v1/api_key_vault?on_conflict=user_id", {
        method: "POST",
        headers: { ...restHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: uid, encrypted_payload }),
      });
      if (!saved.ok) return response({ error: "Kunde inte spara nyckelvalvet." }, 502);
      return response({ ok: true });
    }

    if (body.action === "delete") {
      const deleted = await fetch(rowUrl, { method: "DELETE", headers: restHeaders });
      if (!deleted.ok) return response({ error: "Kunde inte radera nyckelvalvet." }, 502);
      return response({ ok: true });
    }

    return response({ error: "Okänd åtgärd." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internt fel.";
    return response({ error: message }, 400);
  }
});
