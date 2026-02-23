const PIN_HASH_KEY = 'pt_pin_hash';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string): Promise<string> {
  return sha256(pin);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computed = await sha256(pin);
  return computed === hash;
}

export function savePin(hash: string): void {
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function loadPinHash(): string | null {
  return localStorage.getItem(PIN_HASH_KEY);
}
