import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, hashPassword, createSessionToken, verifySessionToken, getCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route: /api/auth/me
    if (path.endsWith('/me')) {
      const cookieHeader = req.headers.get('cookie') || '';
      const token = getCookie(cookieHeader, 'session');

      if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const payload = await verifySessionToken(token);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
      }

      const db = getDb();
      const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const db = getDb();

    // Route: /api/auth/login
    if (path.endsWith('/login')) {
      const { email, password } = (await req.json()) as any;

      if (!email || !password) {
        return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
      }

      const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
      }

      const token = await createSessionToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });

      response.headers.set(
        'Set-Cookie',
        `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );

      return response;
    }

    // Route: /api/auth/logout
    if (path.endsWith('/logout')) {
      const response = NextResponse.json({ success: true });
      response.headers.set(
        'Set-Cookie',
        'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      );
      return response;
    }

    // Route: /api/auth/register
    if (path.endsWith('/register')) {
      const { name, email, password } = (await req.json()) as any;

      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
      if (existing) {
        return NextResponse.json({ error: 'Email address is already registered.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const userId = crypto.randomUUID();
      const newUser = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'user',
        createdAt: Math.floor(Date.now() / 1000),
      };

      await db.insert(users).values(newUser);

      const token = await createSessionToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });

      response.headers.set(
        'Set-Cookie',
        `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );

      return response;
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
