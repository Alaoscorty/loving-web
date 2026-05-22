import { NextResponse } from 'next/server';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BKnz7Hz8KiwfWneCYHgGQo0AlmiRaxzNQeVKt3FbIANgdwk6osk-hk6muhNawNV23C3AsETZEbvVhrrpIy7x22Y';

export async function GET() {
  return NextResponse.json({ vapidPublicKey: VAPID_PUBLIC_KEY });
}
