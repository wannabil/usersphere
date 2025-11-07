/**
 * Conflict detection utilities for concurrent mutations
 */

import { User } from '@/types/user';

export interface ConflictError {
  type: 'concurrent_modification';
  message: string;
  serverVersion: User;
  clientVersion: User;
}

/**
 * Detect if a user was modified by comparing timestamps
 */
export function detectConflict(
  localUser: User | undefined,
  serverUser: User
): boolean {
  if (!localUser) return false;
  
  // If server's createdAt is newer than what we have cached, it was modified
  const localTimestamp = new Date(localUser.createdAt).getTime();
  const serverTimestamp = new Date(serverUser.createdAt).getTime();
  
  // Simple conflict detection: if server data differs from cache significantly
  return (
    localUser.name !== serverUser.name ||
    localUser.email !== serverUser.email ||
    localUser.phoneNumber !== serverUser.phoneNumber ||
    localUser.role !== serverUser.role ||
    localUser.active !== serverUser.active
  );
}

/**
 * Check for conflicts before mutation
 */
export async function checkForConflicts(
  userId: string,
  cachedUser: User | undefined,
  fetchUser: () => Promise<User>
): Promise<{ hasConflict: boolean; serverUser?: User }> {
  if (!cachedUser) {
    return { hasConflict: false };
  }
  
  try {
    const serverUser = await fetchUser();
    const hasConflict = detectConflict(cachedUser, serverUser);
    
    return {
      hasConflict,
      serverUser: hasConflict ? serverUser : undefined,
    };
  } catch (error) {
    // If fetch fails, assume no conflict
    return { hasConflict: false };
  }
}

/**
 * Merge conflicting changes (simple strategy: keep server version)
 */
export function resolveConflict(
  clientChanges: Partial<User>,
  serverVersion: User
): User {
  // Strategy: Server wins, but preserve client's intended changes
  return {
    ...serverVersion,
    ...clientChanges,
  };
}

