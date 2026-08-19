import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_DEFAULT = 'a_very_long_fallback_jwt_secret_key_at_least_32_characters';

function getJwtSecretKey() {
  const secret = process.env.AUTH_SECRET || JWT_SECRET_DEFAULT;
  return new TextEncoder().encode(secret);
}

// 1. Web Crypto API PBKDF2 Hashing
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKeyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyHex = Array.from(new Uint8Array(derivedKeyBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${keyHex}`;
}

// 2. Web Crypto API PBKDF2 Verify
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, keyHex] = parts;

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKeyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  const keyHexToVerify = Array.from(new Uint8Array(derivedKeyBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return keyHexToVerify === keyHex;
}

// 3. JWT Session Creation
export async function createSessionToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretKey());
}

// 4. JWT Session Verification
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

// 5. Get Cookie Helper for Edge Context
export function getCookie(cookieString: string, name: string): string | null {
  if (!cookieString) return null;
  const cookies = cookieString.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}
