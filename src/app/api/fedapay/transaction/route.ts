import { NextResponse } from 'next/server';

const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
const FEDAPAY_API_URL = 'https://api.fedapay.com/v1/transactions';

function createFallbackTransaction(amount: number, description: string) {
  const transactionId = `fdp_${Math.random().toString(36).substring(2, 11)}`;
  const paymentUrl = `https://checkout.fedapay.com/pay?amount=${amount}&description=${encodeURIComponent(description)}`;
  return { transactionId, paymentUrl };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { amount, description, customerEmail, customerName, reference } = body as {
    amount?: number;
    description?: string;
    customerEmail?: string;
    customerName?: string;
    reference?: string;
  };

  if (!amount || !description || !customerEmail || !customerName) {
    return NextResponse.json({ error: 'Missing required payment parameters.' }, { status: 400 });
  }

  if (!FEDAPAY_SECRET_KEY) {
    const fallback = createFallbackTransaction(amount, description);
    return NextResponse.json({ url: fallback.paymentUrl, transactionId: fallback.transactionId });
  }

  try {
    const response = await fetch(FEDAPAY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'XOF',
        description,
        customer: {
          email: customerEmail,
          full_name: customerName,
        },
        return_url: reference ? `${request.headers.get('origin')}/api/fedapay/verify?transactionId=${encodeURIComponent(reference)}` : undefined,
        metadata: {
          reference,
        },
      }),
    });

    const data = await response.json();
    const transactionId = data?.id || data?.transactionId || `fdp_${Math.random().toString(36).substring(2, 11)}`;
    const url = data?.url || data?.redirect_url || data?.checkout_url || data?.payment_url || `https://checkout.fedapay.com/pay?amount=${amount}&description=${encodeURIComponent(description)}`;

    return NextResponse.json({ url, transactionId });
  } catch (error) {
    console.error('FedaPay transaction creation failed:', error);
    const fallback = createFallbackTransaction(amount, description);
    return NextResponse.json({ url: fallback.paymentUrl, transactionId: fallback.transactionId });
  }
}
