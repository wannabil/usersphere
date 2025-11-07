import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { User, CreateUserDto, UpdateUserDto } from '@/types/user';
import { toast } from 'sonner';
import { MutationQueue, generateMutationId } from '@/lib/utils/mutation-queue';

// Query Keys
export const QUERY_KEYS = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  analytics: ['users', 'analytics'] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Fetch all users with caching
 */
export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: usersApi.getUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch single user by ID
 */
export function useUser(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    
    // Initialize from cache if available
    initialData: () => {
      const users = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      return users?.find((user) => user.id === id);
    },
    
    // If we found initial data, it's already stale
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(QUERY_KEYS.users)?.dataUpdatedAt;
    },
  });
}

/**
 * Prefetch user data (for hover states)
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.user(id),
      queryFn: () => usersApi.getUser(id),
      staleTime: 1000 * 60 * 5,
    });
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create new user with optimistic updates
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const mutationQueue = MutationQueue.getInstance();

  return useMutation({
    mutationFn: usersApi.createUser,
    
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      
      // Snapshot current users
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      
      // Generate mutation ID
      const mutationId = generateMutationId();
      
      // Add to persistent queue
      mutationQueue.add({
        id: mutationId,
        type: 'create',
        timestamp: Date.now(),
        data: newUser,
      });
      
      // Optimistically add new user with temporary ID
      const optimisticUser: User = {
        ...newUser,
        id: `temp-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return [...old, optimisticUser];
      });
      
      // Show loading toast
      toast.loading('Creating user...', { id: 'create-user' });
      
      return { previousUsers, optimisticUser, mutationId };
    },
    
    onError: (error: any, newUser, context) => {
      // Remove from persistent queue on error
      if (context?.mutationId) {
        mutationQueue.remove(context.mutationId);
      }
      
      // Rollback to previous state
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previousUsers);
      }
      
      // Refetch to ensure we have accurate server state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      
      toast.error(error?.response?.data?.message || 'Failed to create user', { id: 'create-user' });
    },
    
    onSuccess: (createdUser, variables, context) => {
      // Remove from persistent queue
      if (context?.mutationId) {
        mutationQueue.remove(context.mutationId);
      }
      
      // Replace temporary user with real user from server
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return old.map((user) =>
          user.id === context?.optimisticUser.id ? createdUser : user
        );
      });
      
      // Also cache the individual user
      queryClient.setQueryData(QUERY_KEYS.user(createdUser.id), createdUser);
      
      toast.success('User created successfully', { id: 'create-user' });
    },
    
    onSettled: (data) => {
      // Only invalidate analytics, not the full user list since we updated it directly
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
  });
}

/**
 * Update existing user with optimistic updates
 */
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.updateUser(id, data),
    
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user(id) });
      
      // Snapshot previous state
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      const previousUser = queryClient.getQueryData<User>(QUERY_KEYS.user(id));
      
      // Optimistically update users list
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return old.map((user) =>
          user.id === id ? { ...user, ...updatedData } : user
        );
      });
      
      // Optimistically update single user
      queryClient.setQueryData<User>(QUERY_KEYS.user(id), (old) => {
        return old ? { ...old, ...updatedData } : old;
      });
      
      toast.loading('Updating user...', { id: 'update-user' });
      
      return { previousUsers, previousUser };
    },
    
    onError: (error: any, variables, context) => {
      // Handle 404: User was deleted by another user
      if (error?.response?.status === 404) {
        toast.error('User no longer exists. It may have been deleted by another user.', { id: 'update-user' });
        
        // Remove from cache completely
        queryClient.removeQueries({ queryKey: QUERY_KEYS.user(id) });
        queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
          return old?.filter((user) => user.id !== id) || [];
        });
        
        return;
      }
      
      // Rollback both caches on other errors
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(QUERY_KEYS.user(id), context.previousUser);
      }
      
      // Force refetch to reconcile with server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(id) });
      
      toast.error('Failed to update user', { id: 'update-user' });
    },
    
    onSuccess: (updatedUser) => {
      // Update the cache with server response
      queryClient.setQueryData(QUERY_KEYS.user(id), updatedUser);
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return old?.map((user) => (user.id === id ? updatedUser : user)) || [];
      });
      
      toast.success('User updated successfully', { id: 'update-user' });
    },
    
    onSettled: () => {
      // Only invalidate analytics since we updated caches directly
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
  });
}

/**
 * Delete single user with optimistic updates
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteUser,
    
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      
      // Optimistically remove user from list
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return old.filter((user) => user.id !== userId);
      });
      
      // Remove single user query
      queryClient.removeQueries({ queryKey: QUERY_KEYS.user(userId) });
      
      toast.loading('Deleting user...', { id: 'delete-user' });
      
      return { previousUsers };
    },
    
    onError: (error, userId, context) => {
      // Restore user in list
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previousUsers);
      }
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      
      toast.error('Failed to delete user', { id: 'delete-user' });
    },
    
    onSuccess: (data, userId) => {
      // Cache is already updated optimistically, no need to refetch
      toast.success('User deleted successfully', { id: 'delete-user' });
    },
    
    onSettled: () => {
      // Only invalidate analytics
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
  });
}

/**
 * Bulk delete users with optimistic updates
 */
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.bulkDeleteUsers,
    
    onMutate: async (userIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      
      // Store deleted users for potential undo
      const deletedUsers = previousUsers?.filter((user) =>
        userIds.includes(user.id)
      );
      
      // Optimistically remove users from list
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return old.filter((user) => !userIds.includes(user.id));
      });
      
      // Remove individual user queries
      userIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.user(id) });
      });
      
      toast.loading(`Deleting ${userIds.length} users...`, { id: 'bulk-delete' });
      
      return { previousUsers, deletedUsers };
    },
    
    onError: (error, userIds, context) => {
      // Restore all users
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previousUsers);
      }
      
      // Force refetch to reconcile
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      
      toast.error('Failed to delete users', { id: 'bulk-delete' });
    },
    
    onSuccess: (data, userIds) => {
      // Cache is already updated optimistically
      toast.success(`${userIds.length} users deleted successfully`, { id: 'bulk-delete' });
    },
    
    onSettled: () => {
      // Only invalidate analytics
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
  });
}

