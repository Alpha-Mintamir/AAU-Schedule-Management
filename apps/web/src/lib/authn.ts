import { NextRequest } from 'next/server';

// Minimal helper to resolve the current actor id in dev
// Order: header x-actor-id → cookie ba_uid → env DEV_ACTOR_ID
export function getActorId(req: NextRequest): string | null {
  const header = req.headers.get('x-actor-id');
  if (header) return header;
  // In a real setup, parse Better Auth session and map to user id
  const cookie = req.cookies.get('ba_uid')?.value;
  if (cookie) return cookie;
  if (process.env.DEV_ACTOR_ID) return process.env.DEV_ACTOR_ID;
  return null;
}


