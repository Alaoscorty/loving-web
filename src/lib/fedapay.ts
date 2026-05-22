
/**
 * Utilitaire pour la gestion des paiements FedaPay
 */

export async function createFedaPayTransaction({ 
  amount, 
  description, 
  customerEmail, 
  customerName,
  reference,
}: { 
  amount: number; 
  description: string; 
  customerEmail: string; 
  customerName: string; 
  reference?: string;
}) {
  const response = await fetch('/api/fedapay/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, description, customerEmail, customerName, reference }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Impossible de créer la transaction FedaPay.');
  }

  return response.json();
}
