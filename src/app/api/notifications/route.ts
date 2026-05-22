import { NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getServerFirestore } from '@/lib/server/firebase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('uid');
  const limitParam = Number(url.searchParams.get('limit') || '50');

  if (!userId) {
    return NextResponse.json({ error: 'Missing uid parameter.' }, { status: 400 });
  }

  const firestore = getServerFirestore();
  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('recipientUid', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(Math.min(limitParam, 100))
  );

  const notificationsSnap = await getDocs(notificationsQuery);
  const notifications = notificationsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));

  return NextResponse.json({ notifications });
}
