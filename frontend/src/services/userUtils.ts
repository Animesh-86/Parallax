/**
 * Shared user identity utilities. Single source of truth for display name
 * and user ID extraction from JWT tokens.
 */

export function getDisplayName(): string {
  const token = localStorage.getItem("access_token");
  if (!token) return "You";
  try {
    const decoded: any = JSON.parse(atob(token.split('.')[1]));
    return decoded.displayName || decoded.fullName || decoded.username || decoded.sub?.substring(0, 6) || "You";
  } catch { return "You"; }
}

export function getUserId(): string {
  const token = localStorage.getItem("access_token");
  if (!token) return '';
  try {
    const decoded: any = JSON.parse(atob(token.split('.')[1]));
    return decoded.userId || decoded.sub || '';
  } catch { return ''; }
}

export function getAvatarInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
}

export function getUserColor(str: string): string {
  const colors = ['#D4AF37', '#A1A1AA', '#F59E0B', '#D4AF37', '#EF6461', '#D4AF37'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[hash % colors.length];
}
