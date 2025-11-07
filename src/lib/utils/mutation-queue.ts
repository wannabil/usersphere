/**
 * Persistent mutation queue for handling refresh scenarios
 * Stores pending mutations in localStorage and retries them after refresh
 */

import { CreateUserDto, UpdateUserDto } from '@/types/user';

export type MutationType = 'create' | 'update' | 'delete';

export interface PendingMutation {
  id: string;
  type: MutationType;
  timestamp: number;
  data: CreateUserDto | UpdateUserDto | { userId: string };
  userId?: string; // For update/delete operations
}

const STORAGE_KEY = 'pending-mutations';
const MAX_AGE = 5 * 60 * 1000; // 5 minutes

export class MutationQueue {
  private static instance: MutationQueue;
  
  private constructor() {
    // Cleanup old mutations on initialization
    this.cleanup();
  }
  
  static getInstance(): MutationQueue {
    if (!MutationQueue.instance) {
      MutationQueue.instance = new MutationQueue();
    }
    return MutationQueue.instance;
  }
  
  /**
   * Add a mutation to the queue
   */
  add(mutation: PendingMutation): void {
    const mutations = this.getAll();
    mutations.push(mutation);
    this.save(mutations);
  }
  
  /**
   * Get all pending mutations
   */
  getAll(): PendingMutation[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const mutations: PendingMutation[] = JSON.parse(stored);
      // Filter out old mutations
      return mutations.filter(m => Date.now() - m.timestamp < MAX_AGE);
    } catch (error) {
      console.error('Error reading mutation queue:', error);
      return [];
    }
  }
  
  /**
   * Remove a mutation from the queue
   */
  remove(mutationId: string): void {
    const mutations = this.getAll().filter(m => m.id !== mutationId);
    this.save(mutations);
  }
  
  /**
   * Clear all mutations
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
  
  /**
   * Cleanup old mutations
   */
  private cleanup(): void {
    const mutations = this.getAll();
    this.save(mutations); // This will filter out old mutations
  }
  
  /**
   * Save mutations to localStorage
   */
  private save(mutations: PendingMutation[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mutations));
    } catch (error) {
      console.error('Error saving mutation queue:', error);
    }
  }
}

/**
 * Generate a unique mutation ID
 */
export function generateMutationId(): string {
  return `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

