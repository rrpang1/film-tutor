// Optional end-to-end encryption for sync. With a passphrase set, everything sent to GitHub is
// AES-GCM ciphertext under a key derived on this device (PBKDF2-SHA256). The passphrase never
// leaves the device; GitHub only ever stores the envelope below.

const ITER = 210_000;
const TAG = "ft-enc-1";
type Envelope = { ft: typeof TAG; s: string; i: string; c: string };

const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const keys = new Map<string, Promise<CryptoKey>>();
function key(pass: string, salt: Uint8Array) {
  const id = pass + "|" + b64(salt);
  if (!keys.has(id)) keys.set(id, (async () => {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  })());
  return keys.get(id)!;
}

// one salt per device session keeps key derivation to once per sync
let sessionSalt: Uint8Array | null = null;

export function isSealed(text: string): boolean {
  return text.startsWith("{\"ft\":\"" + TAG);
}

export async function seal(text: string, pass: string): Promise<string> {
  sessionSalt ??= crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(pass, sessionSalt), new TextEncoder().encode(text));
  const env: Envelope = { ft: TAG, s: b64(sessionSalt), i: b64(iv), c: b64(new Uint8Array(ct)) };
  return JSON.stringify(env);
}

export class NeedsPassphrase extends Error {}

/** Decrypts an envelope; plain text passes through unchanged. */
export async function unseal(text: string, pass: string | null): Promise<string> {
  if (!isSealed(text)) return text;
  if (!pass) throw new NeedsPassphrase("your synced data is encrypted: enter the sync passphrase on this device");
  const env = JSON.parse(text) as Envelope;
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(env.i) as BufferSource }, await key(pass, unb64(env.s)), unb64(env.c) as BufferSource);
    return new TextDecoder().decode(pt);
  } catch { throw new NeedsPassphrase("the sync passphrase doesn't match the one used on your other devices"); }
}
