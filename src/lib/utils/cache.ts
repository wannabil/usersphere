import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/hooks/use-users';
import { User } from '@/types/user';
import { usersApi } from '@/lib/api/users';

/**
 * Invalidate all user-related queries
 */
export function invalidateUserQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
}

/**
 * Get cached users data
 */
export function getCachedUsers(queryClient: QueryClient): User[] | undefined {
  return queryClient.getQueryData<User[]>(QUERY_KEYS.users);
}

/**
 * Update cached user
 */
export function updateCachedUser(
  queryClient: QueryClient,
  userId: string,
  updater: (user: User) => User
) {
  // Update in users list
  queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
    return old?.map((user) => (user.id === userId ? updater(user) : user));
  });

  // Update single user cache
  queryClient.setQueryData<User>(QUERY_KEYS.user(userId), (old) => {
    return old ? updater(old) : old;
  });
}

/**
 * Remove user from cache
 */
export function removeCachedUser(queryClient: QueryClient, userId: string) {
  queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
    return old?.filter((user) => user.id !== userId);
  });

  queryClient.removeQueries({ queryKey: QUERY_KEYS.user(userId) });
}

/**
 * Prefetch users for better UX
 */
export async function prefetchUsers(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: usersApi.getUsers,
    staleTime: 1000 * 60 * 5,
  });
}

