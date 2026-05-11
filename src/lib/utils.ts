
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Détermine si un utilisateur est considéré comme en ligne.
 * Seuil : 5 minutes (300 000 ms)
 */
export function isUserOnline(lastActive?: string): boolean {
  if (!lastActive) return false;
  const lastActiveDate = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const diff = now - lastActiveDate;
  return diff < 300000; // 5 minutes
}
