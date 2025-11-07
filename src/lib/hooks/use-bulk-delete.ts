import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUndo } from './use-undo';
import { QUERY_KEYS } from './use-users';
import { toast } from 'sonner';
import { User } from '@/types/user';
import UndoToast from '@/components/users/undo-toast';

export function useBulkDeleteWithUndo() {
  const queryClient = useQueryClient();
  const { startUndo, cancelUndo } = useUndo();

  // Actual deletion mutation (called after timeout)
  const permanentDelete = useMutation({
    mutationFn: usersApi.bulkDeleteUsers,
    
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      toast.success(`${userIds.length} user${userIds.length > 1 ? 's' : ''} permanently deleted`);
    },
    
    onError: (error, userIds, context: any) => {
      toast.error('Failed to permanently delete users');
      // Restore users on error
      if (context?.usersToRestore) {
        restoreUsers(context.usersToRestore);
      }
    },
  });

  // Restore mutation (for undo)
  const restoreMutation = useMutation({
    mutationFn: async (users: User[]) => {
      // Fetch fresh server state first to ensure we're not working with stale data
      const freshUsers = await usersApi.getUsers();
      
      // Filter out users that already exist (may have been restored by another action)
      const usersToRestore = users.filter(
        (user) => !freshUsers.some((fresh) => fresh.email === user.email)
      );
      
      if (usersToRestore.length === 0) {
        return [];
      }
      
      // Re-create users via API
      return Promise.all(
        usersToRestore.map((user) => usersApi.createUser({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          active: user.active,
          avatar: user.avatar,
          bio: user.bio,
        }))
      );
    },
    
    onSuccess: (restoredUsers) => {
      // Refetch to ensure cache matches server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      
      if (restoredUsers.length > 0) {
        toast.success(`${restoredUsers.length} user${restoredUsers.length > 1 ? 's' : ''} restored`);
      } else {
        toast.info('Users already exist, no restoration needed');
      }
    },
    
    onError: (error) => {
      toast.error('Failed to restore users. They may have been permanently deleted.');
      // Force refetch to sync with server state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });

  // Helper function to restore users
  const restoreUsers = (users: User[]) => {
    if (users.length > 0) {
      // Restore users to cache immediately
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
        return [...old, ...users];
      });

      // Call API to restore (re-create) users
      restoreMutation.mutate(users);
    }
  };

  // Main bulk delete function with undo
  const bulkDeleteWithUndo = async (userIds: string[]) => {
    // 1. Get users to be deleted (for potential restore)
    const allUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
    const usersToDelete = allUsers?.filter((user) => userIds.includes(user.id)) || [];

    if (usersToDelete.length === 0) {
      toast.error('No users to delete');
      return;
    }

    // Generate unique operation ID
    const operationId = `bulk-delete-${Date.now()}`;

    // 2. Optimistically remove from UI
    queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old = []) => {
      return old.filter((user) => !userIds.includes(user.id));
    });

    // 3. Show undo toast
    const toastId = toast.info(
      UndoToast({
        count: usersToDelete.length,
        onUndo: () => {
          handleUndo(operationId, usersToDelete);
          toast.dismiss(toastId);
        },
      }),
      {
        duration: 5000,
        onDismiss: () => {
          // Toast dismissed manually, don't cancel timer - let it complete
        },
      }
    );

    // 4. Start undo timer with unique ID
    startUndo(operationId, usersToDelete, () => {
      // Timeout expired, permanently delete
      permanentDelete.mutate(userIds, {
        onError: (error, variables, context) => {
          // Pass users to restore on error
          return { usersToRestore: usersToDelete };
        },
      });
    });
  };

  // Handle undo action
  const handleUndo = (operationId: string, users: User[]) => {
    cancelUndo(operationId); // Clear specific operation timeout
    restoreUsers(users);
  };

  return {
    bulkDeleteWithUndo,
    isPending: permanentDelete.isPending || restoreMutation.isPending,
  };
}

