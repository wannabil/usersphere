/**
 * Mutex class for ensuring sequential execution of async operations
 * Prevents race conditions when multiple operations need to run one at a time
 */
class Mutex {
  private mutex = Promise.resolve();

  /**
   * Acquire a lock and return an unlock function
   */
  lock(): PromiseLike<() => void> {
    let begin: (unlock: () => void) => void = () => {};

    this.mutex = this.mutex.then(() => {
      return new Promise(begin);
    });

    return new Promise((resolve) => {
      begin = resolve;
    });
  }

  /**
   * Execute a function with mutex protection
   * Ensures the function runs after all previous calls complete
   */
  async dispatch<T>(fn: () => Promise<T>): Promise<T> {
    const unlock = await this.lock();
    try {
      return await fn();
    } finally {
      unlock();
    }
  }
}

/**
 * Global mutex for mutation operations
 * Use this when you need strict sequential execution across mutations
 * 
 * Example usage:
 * ```typescript
 * mutationFn: async (data) => {
 *   return mutationMutex.dispatch(() => usersApi.updateUser(id, data));
 * }
 * ```
 */
export const mutationMutex = new Mutex();

export default Mutex;

