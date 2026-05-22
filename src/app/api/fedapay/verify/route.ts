import { NextResponse } from 'next/server';
import { collection, query, where, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getServerFirestore } from '@/lib/server/firebase-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.transactionId) {
    return NextResponse.json({ error: 'Missing transactionId.' }, { status: 400 });
  }

  const { transactionId } = body as { transactionId: string };
  const firestore = getServerFirestore();

  const rendezvousQuery = query(
    collection(firestore, 'rendezvous'),
    where('paymentTransactionId', '==', transactionId),
    limit(1)
  );
  const rendezvousSnap = await getDocs(rendezvousQuery);

  if (!rendezvousSnap.empty) {
    const rendezvousDoc = rendezvousSnap.docs[0];
    await updateDoc(doc(firestore, 'rendezvous', rendezvousDoc.id), {
      paymentStatus: 'paid',
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, type: 'rendezvous', id: rendezvousDoc.id });
  }

  const verificationQuery = query(
    collection(firestore, 'users'),
    where('verificationPaymentTransactionId', '==', transactionId),
    limit(1)
  );
  const verificationSnap = await getDocs(verificationQuery);

  if (!verificationSnap.empty) {
    const userDoc = verificationSnap.docs[0];
    await updateDoc(doc(firestore, 'users', userDoc.id), {
      verificationStatus: 'pending',
      verificationRejectionReason: null,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, type: 'verification', id: userDoc.id });
  }

  return NextResponse.json({ error: 'No matching transaction record found.' }, { status: 404 });
}
