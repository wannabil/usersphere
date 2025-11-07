/**
 * Hook to process pending mutations from the queue
 * Runs on app initialization to retry mutations after refresh
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MutationQueue, PendingMutation } from '@/lib/utils/mutation-queue';
import { usersApi } from '@/lib/api/users';
import { QUERY_KEYS } from './use-users';
import { toast } from 'sonner';

export function useMutationQueue() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const queue = MutationQueue.getInstance();
    const pendingMutations = queue.getAll();
    
    if (pendingMutations.length === 0) return;
    
    // Process each pending mutation
    pendingMutations.forEach(async (mutation) => {
      try {
        await processMutation(mutation);
        queue.remove(mutation.id);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      } catch (error) {
        console.error('Failed to process pending mutation:', error);
        queue.remove(mutation.id); // Remove failed mutations to prevent infinite retry
        
        toast.error(`Failed to complete pending ${mutation.type} operation`);
      }
    });
  }, [queryClient]);
}

async function processMutation(mutation: PendingMutation): Promise<void> {
  switch (mutation.type) {
    case 'create':
      await usersApi.createUser(mutation.data as any);
      toast.success('Pending user creation completed');
      break;
      
    case 'update':
      if (mutation.userId) {
        await usersApi.updateUser(mutation.userId, mutation.data as any);
        toast.success('Pending user update completed');
      }
      break;
      
    case 'delete':
      if (mutation.userId) {
        await usersApi.deleteUser(mutation.userId);
        toast.success('Pending user deletion completed');
      }
      break;
      
    default:
      console.warn('Unknown mutation type:', mutation.type);
  }
}

