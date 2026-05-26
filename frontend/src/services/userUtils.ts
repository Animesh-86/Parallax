/**
 * Shared user identity utilities. Single source of truth for display name,
 * user ID, initials, and onboarding status extraction from JWT tokens.
 */

interface DecodedToken {
  sub?: string;
  fullName?: string;
  displayName?: string;
  username?: string;
  email?: string;
  userId?: string;
  onboardingComplete?: boolean;
}

function decodeToken(): DecodedToken | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return null; }
}

export function getDisplayName(): string {
  const decoded = decodeToken();
  if (!decoded) return "You";
  return decoded.fullName || decoded.displayName || decoded.username || decoded.sub?.substring(0, 6) || "You";
}

export function getUserId(): string {
  const decoded = decodeToken();
  if (!decoded) return '';
  return decoded.userId || decoded.sub || '';
}

export function isOnboardingComplete(): boolean {
  const decoded = decodeToken();
  if (!decoded) return true; // If no token, don't redirect
  return decoded.onboardingComplete !== false;
}

/**
 * Generates avatar initials from a name.
 * "Animesh Sharma" → "AS"
 * "nimesh_harma" → "NH" (split on underscore)
 * "animesh" → "AN"
 */
export function getAvatarInitials(name: string): string {
  if (!name || name.trim().length === 0) return '?';
  
  const cleaned = name.trim();
  
  // Try splitting on spaces first (e.g. "Animesh Sharma")
  const spaceParts = cleaned.split(/\s+/).filter(Boolean);
  if (spaceParts.length >= 2) {
    return (spaceParts[0][0] + spaceParts[1][0]).toUpperCase();
  }
  
  // Try splitting on underscores (e.g. "nimesh_harma")
  const underscoreParts = cleaned.split('_').filter(Boolean);
  if (underscoreParts.length >= 2) {
    return (underscoreParts[0][0] + underscoreParts[1][0]).toUpperCase();
  }
  
  // Single word — take first 2 chars
  return cleaned.substring(0, 2).toUpperCase();
}

export function getUserColor(str: string): string {
  const colors = ['#D4AF37', '#A1A1AA', '#F59E0B', '#D4AF37', '#EF6461', '#D4AF37'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[hash % colors.length];
}
