export async function fetchSiteNotifications(userId: string, limit = 50) {
  const response = await fetch(`/api/notifications?uid=${encodeURIComponent(userId)}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Impossible de récupérer les notifications du site.');
  }
  return response.json();
}

export async function fetchPushConfig() {
  const response = await fetch('/api/push-config');
  if (!response.ok) {
    throw new Error('Impossible de récupérer la configuration de push.');
  }
  return response.json();
}
