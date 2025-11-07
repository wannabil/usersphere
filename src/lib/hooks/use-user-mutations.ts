import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { UpdateUserDto } from '@/types/user';

export const USERS_QUERY_KEY = ['users'];
export const USER_QUERY_KEY = (id: string) => ['users', id];

// Fetch single user for edit form
export function useUser(id: string) {
  return useQuery({
    queryKey: USER_QUERY_KEY(id),
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
}

// Create user mutation with optimistic updates
export function useCreateUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: usersApi.createUser,
    
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
      
      // Snapshot current users
      const previousUsers = queryClient.getQueryData<any[]>(USERS_QUERY_KEY);
      
      // Optimistically add new user with temporary ID
      const optimisticUser = {
        ...newUser,
        id: `temp-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<any[]>(USERS_QUERY_KEY, (old = []) => {
        return [...old, optimisticUser];
      });
      
      // Show loading toast
      toast.loading('Creating user...', { id: 'create-user' });
      
      return { previousUsers, optimisticUser };
    },
    
    onError: (error: any, newUser, context) => {
      // Rollback to previous state
      if (context?.previousUsers) {
        queryClient.setQueryData(USERS_QUERY_KEY, context.previousUsers);
      }
      
      toast.error(error?.response?.data?.message || 'Failed to create user', { id: 'create-user' });
      console.error('Create user error:', error);
    },
    
    onSuccess: (createdUser, variables, context) => {
      // Replace temporary user with real user from server
      queryClient.setQueryData<any[]>(USERS_QUERY_KEY, (old = []) => {
        return old.map((user) =>
          user.id === context?.optimisticUser.id ? createdUser : user
        );
      });
      
      toast.success('User created successfully', { id: 'create-user' });
      router.push('/users');
    },
    
    onSettled: () => {
      // Always refetch to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

// Update user mutation with optimistic updates
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.updateUser(id, data),
    
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEY(id) });
      
      // Snapshot previous state
      const previousUsers = queryClient.getQueryData<any[]>(USERS_QUERY_KEY);
      const previousUser = queryClient.getQueryData<any>(USER_QUERY_KEY(id));
      
      // Optimistically update users list
      queryClient.setQueryData<any[]>(USERS_QUERY_KEY, (old = []) => {
        return old.map((user) =>
          user.id === id ? { ...user, ...updatedData } : user
        );
      });
      
      // Optimistically update single user
      queryClient.setQueryData<any>(USER_QUERY_KEY(id), (old: any) => {
        return old ? { ...old, ...updatedData } : old;
      });
      
      toast.loading('Updating user...', { id: 'update-user' });
      
      return { previousUsers, previousUser };
    },
    
    onError: (error: any, variables, context) => {
      // Rollback both caches
      if (context?.previousUsers) {
        queryClient.setQueryData(USERS_QUERY_KEY, context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(USER_QUERY_KEY(id), context.previousUser);
      }
      
      if (error?.response?.status === 404) {
        toast.error('User not found. It may have been deleted.', { id: 'update-user' });
        router.push('/users');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to update user', { id: 'update-user' });
      }
      console.error('Update user error:', error);
    },
    
    onSuccess: () => {
      toast.success('User updated successfully', { id: 'update-user' });
      router.push('/users');
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY(id) });
    },
  });
}
