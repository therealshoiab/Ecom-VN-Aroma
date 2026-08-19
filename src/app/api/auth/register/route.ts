import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as any;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if email already registered
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
    if (existing) {
      return NextResponse.json({ error: 'Email address is already registered.' }, { status: 400 });
    }

    // Hash password & Create user
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'user', // default role
      createdAt: Math.floor(Date.now() / 1000),
    };

    await db.insert(users).values(newUser);

    // Create session JWT token
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return response with Set-Cookie header
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
  } catch (e: any) {
    console.error('Registration failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
