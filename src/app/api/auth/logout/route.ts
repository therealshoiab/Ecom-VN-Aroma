import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear cookie by setting Max-Age=0
  response.headers.set(
    'Set-Cookie',
    'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  
  return response;
}
